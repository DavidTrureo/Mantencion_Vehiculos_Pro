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

@RestController
@RequestMapping("mantenimientos")
public class MantenimientoController {

    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

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

        Mantenimiento entidad = MantenimientoMapper.toEntity(dto, vehiculo);
        Mantenimiento guardado = mantenimientoRepository.save(entidad);
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
        Mantenimiento existente = mantenimientoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado"));

        Vehiculo vehiculo = vehiculoRepository.findById(dto.getVehiculoId())
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

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
}