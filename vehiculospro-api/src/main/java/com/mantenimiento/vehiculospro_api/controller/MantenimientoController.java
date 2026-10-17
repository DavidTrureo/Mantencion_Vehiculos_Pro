package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.dto.MantenimientoDTO;
import com.mantenimiento.vehiculospro_api.mapper.MantenimientoMapper;
import com.mantenimiento.vehiculospro_api.model.Mantenimiento;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import com.mantenimiento.vehiculospro_api.repository.MantenimientoRepository;
import com.mantenimiento.vehiculospro_api.repository.VehiculoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import com.mantenimiento.vehiculospro_api.service.FirebaseService;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.model.UserRole;

@RestController
@RequestMapping({"/mantenimientos", "/api/mantenimientos"})
@SuppressWarnings("null")
public class MantenimientoController {

    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private FirebaseService firebaseService;

    @GetMapping("/vehiculo/{vehiculoId}")
    public ResponseEntity<List<MantenimientoDTO>> getMantenimientosPorVehiculo(@PathVariable Long vehiculoId) {
        List<Mantenimiento> lista = mantenimientoRepository.findByVehiculoId(vehiculoId);
        List<MantenimientoDTO> dtos = lista.stream()
                .map(MantenimientoMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/vehiculo/{vehiculoId}")
    public ResponseEntity<MantenimientoDTO> crearMantenimiento(
            @PathVariable Long vehiculoId,
            @Valid @RequestBody MantenimientoDTO dto
    ) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        validarMantenimiento(vehiculoId, dto, null);

        Mantenimiento entidad = MantenimientoMapper.toEntity(dto, vehiculo);
        Mantenimiento guardado = mantenimientoRepository.save(entidad);

        // Send FCM Notifications asynchronously
        new Thread(() -> {
            try {
                String patente = vehiculo.getPatente() != null ? vehiculo.getPatente() : "Sin Patente";
                String title = "VehículosPro: Nueva Mantención / Observación";
                String body = String.format("El vehículo %s (%s %s) registró: %s", patente, vehiculo.getMarca(), vehiculo.getModelo(), guardado.getTipo());
                
                // Find all active admins and mechanics with FCM tokens
                List<Usuario> receptores = usuarioRepository.findAll().stream()
                        .filter(u -> (u.getRole() == UserRole.ADMIN || u.getRole() == UserRole.MECANICO) 
                                && u.getFcmToken() != null && !u.getFcmToken().isBlank())
                        .collect(Collectors.toList());

                for (Usuario receptor : receptores) {
                    firebaseService.sendPushNotification(receptor.getFcmToken(), title, body);
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }).start();

        return ResponseEntity.ok(MantenimientoMapper.toDTO(guardado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MantenimientoDTO> obtenerPorId(@PathVariable Long id) {
        Mantenimiento mantenimiento = mantenimientoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado"));
        return ResponseEntity.ok(MantenimientoMapper.toDTO(mantenimiento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody MantenimientoDTO dto
    ) {
        mantenimientoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado"));

        Vehiculo vehiculo = vehiculoRepository.findById(dto.getVehiculoId())
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        validarMantenimiento(dto.getVehiculoId(), dto, id);

        Mantenimiento actualizado = MantenimientoMapper.toEntity(dto, vehiculo);
        actualizado.setId(id); // Asegura que se actualice el existente
        mantenimientoRepository.save(actualizado);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!mantenimientoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        mantenimientoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void validarMantenimiento(Long vehiculoId, MantenimientoDTO dto, Long currentMantenimientoId) {
        if (dto.getCosto() != null && dto.getCosto() < 0) {
            throw new RuntimeException("El costo no puede ser negativo.");
        }
        if (dto.getFecha() != null && !dto.getFecha().isBlank()) {
            try {
                java.time.LocalDate selectDate = java.time.LocalDate.parse(dto.getFecha());
                if (selectDate.isAfter(java.time.LocalDate.now())) {
                    throw new RuntimeException("La fecha no puede ser futura.");
                }
            } catch (java.time.format.DateTimeParseException e) {
                throw new RuntimeException("Formato de fecha inválido.");
            }
        }
        
        List<Mantenimiento> lista = mantenimientoRepository.findByVehiculoId(vehiculoId);
        Mantenimiento ultimo = lista.stream()
                .filter(m -> m.getTipo().equalsIgnoreCase(dto.getTipo()) && (currentMantenimientoId == null || !m.getId().equals(currentMantenimientoId)))
                .max(java.util.Comparator.comparingInt(Mantenimiento::getKilometraje))
                .orElse(null);
                
        if (ultimo != null && dto.getKilometraje() < ultimo.getKilometraje()) {
            throw new RuntimeException("El kilometraje debe ser mayor o igual al anterior de este tipo (" + ultimo.getKilometraje() + " km).");
        }
    }
}