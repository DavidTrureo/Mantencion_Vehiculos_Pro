package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.dto.VehiculoDTO;
import com.mantenimiento.vehiculospro_api.mapper.VehiculoMapper;
import com.mantenimiento.vehiculospro_api.model.Mantenimiento;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import com.mantenimiento.vehiculospro_api.repository.MantenimientoRepository;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import com.mantenimiento.vehiculospro_api.repository.VehiculoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/vehiculos", "/vehiculos"})
public class VehiculoController {

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    // Listado optimizado y ligero: NO transfiere megabytes de imágenes Base64
    @GetMapping
    public ResponseEntity<List<VehiculoDTO>> obtenerTodos() {
        List<Vehiculo> lista = vehiculoRepository.findAll();
        lista.forEach(this::calcularAlertasYEstados);
        List<VehiculoDTO> dtos = lista.stream()
                .map(VehiculoMapper::toLightDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Listado por usuario optimizado y ligero
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<VehiculoDTO>> obtenerVehiculos(@PathVariable Long usuarioId) {
        List<Vehiculo> lista = vehiculoRepository.findByPropietarioId(usuarioId);
        lista.forEach(this::calcularAlertasYEstados);
        List<VehiculoDTO> dtos = lista.stream()
                .map(VehiculoMapper::toLightDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Consulta individual por ID: Devuelve el vehículo completo CON todas sus imágenes en alta resolución
    @GetMapping("/{vehiculoId}")
    public ResponseEntity<VehiculoDTO> obtenerVehiculoPorId(@PathVariable Long vehiculoId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));
        calcularAlertasYEstados(vehiculo);
        return ResponseEntity.ok(VehiculoMapper.toDTO(vehiculo));
    }

    @PostMapping("/usuario/{usuarioId}")
    public ResponseEntity<VehiculoDTO> crearVehiculo(
            @PathVariable Long usuarioId,
            @Valid @RequestBody VehiculoDTO dto
    ) {
        Usuario propietario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Vehiculo entidad = VehiculoMapper.toEntity(dto, propietario);

        // Generar QR automáticamente
        Vehiculo guardado = vehiculoRepository.save(entidad);
        guardado.setQrCode("VEHICULO:" + guardado.getId());
        guardado = vehiculoRepository.save(guardado);
        
        calcularAlertasYEstados(guardado);
        return ResponseEntity.ok(VehiculoMapper.toDTO(guardado));
    }

    @PutMapping("/{vehiculoId}")
    public ResponseEntity<VehiculoDTO> actualizarVehiculo(
            @PathVariable Long vehiculoId,
            @Valid @RequestBody VehiculoDTO dto
    ) {
        Vehiculo existente = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        existente.setMarca(dto.getMarca());
        existente.setModelo(dto.getModelo());
        existente.setAnio(dto.getAnio());
        existente.setKilometraje(dto.getKilometraje());
        existente.setPatente(dto.getPatente());
        if (dto.getActivo() != null) existente.setActivo(dto.getActivo());

        // Actualizar asignación de conductor / propietario
        if (dto.getPropietarioId() != null) {
            Usuario nuevoPropietario = usuarioRepository.findById(dto.getPropietarioId()).orElse(null);
            existente.setPropietario(nuevoPropietario);
        }

        // Documentación Legal Chilena (preserva imagen anterior si no se subió una nueva o si viene placeholder)
        existente.setRevisionTecnicaVencimiento(dto.getRevisionTecnicaVencimiento());
        existente.setRevisionTecnicaNumero(dto.getRevisionTecnicaNumero());
        if (dto.getRevisionTecnicaImagen() != null && !"PRESENT".equals(dto.getRevisionTecnicaImagen())) {
            existente.setRevisionTecnicaImagen(dto.getRevisionTecnicaImagen());
        }

        existente.setSoapAseguradora(dto.getSoapAseguradora());
        existente.setSoapVencimiento(dto.getSoapVencimiento());
        existente.setSoapPoliza(dto.getSoapPoliza());
        if (dto.getSoapImagen() != null && !"PRESENT".equals(dto.getSoapImagen())) {
            existente.setSoapImagen(dto.getSoapImagen());
        }

        existente.setPermisoCirculacionMunicipalidad(dto.getPermisoCirculacionMunicipalidad());
        existente.setPermisoCirculacionVencimiento(dto.getPermisoCirculacionVencimiento());
        existente.setPermisoCirculacionFolio(dto.getPermisoCirculacionFolio());
        if (dto.getPermisoCirculacionImagen() != null && !"PRESENT".equals(dto.getPermisoCirculacionImagen())) {
            existente.setPermisoCirculacionImagen(dto.getPermisoCirculacionImagen());
        }

        // 4. Padrón del Vehículo (Registro Civil)
        existente.setPadronFolio(dto.getPadronFolio());
        existente.setPadronVin(dto.getPadronVin());
        existente.setPadronMotor(dto.getPadronMotor());
        existente.setPadronFechaEmision(dto.getPadronFechaEmision());
        if (dto.getPadronImagen() != null && !"PRESENT".equals(dto.getPadronImagen())) {
            existente.setPadronImagen(dto.getPadronImagen());
        }

        Vehiculo actualizado = vehiculoRepository.save(existente);
        calcularAlertasYEstados(actualizado);
        return ResponseEntity.ok(VehiculoMapper.toDTO(actualizado));
    }

    @PatchMapping("/{vehiculoId}/toggle-activo")
    public ResponseEntity<VehiculoDTO> toggleActivo(@PathVariable Long vehiculoId) {
        Vehiculo v = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));
        v.setActivo(v.getActivo() == null || !v.getActivo());
        Vehiculo guardado = vehiculoRepository.save(v);
        calcularAlertasYEstados(guardado);
        return ResponseEntity.ok(VehiculoMapper.toDTO(guardado));
    }

    @DeleteMapping("/{vehiculoId}")
    public ResponseEntity<Void> eliminarVehiculo(@PathVariable Long vehiculoId) {
        vehiculoRepository.deleteById(vehiculoId);
        return ResponseEntity.noContent().build();
    }

    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    @GetMapping("/makes")
    public ResponseEntity<List<String>> obtenerMarcas() {
        String url = "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json";
        try {
            com.mantenimiento.vehiculospro_api.dto.NhtsaMakeResponse response = restTemplate.getForObject(url, com.mantenimiento.vehiculospro_api.dto.NhtsaMakeResponse.class);
            if (response != null && response.getResults() != null) {
                List<String> makes = response.getResults().stream()
                        .map(com.mantenimiento.vehiculospro_api.dto.NhtsaMakeResponse.NhtsaMake::getMakeName)
                        .sorted()
                        .collect(Collectors.toList());
                return ResponseEntity.ok(makes);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/models")
    public ResponseEntity<List<String>> obtenerModelos(@RequestParam String make) {
        if (make == null || make.isBlank()) {
            return ResponseEntity.ok(List.of());
        }
        String url = "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/" + make + "?format=json";
        try {
            com.mantenimiento.vehiculospro_api.dto.NhtsaModelResponse response = restTemplate.getForObject(url, com.mantenimiento.vehiculospro_api.dto.NhtsaModelResponse.class);
            if (response != null && response.getResults() != null) {
                List<String> models = response.getResults().stream()
                        .map(com.mantenimiento.vehiculospro_api.dto.NhtsaModelResponse.NhtsaModel::getModelName)
                        .distinct()
                        .sorted()
                        .collect(Collectors.toList());
                return ResponseEntity.ok(models);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ResponseEntity.ok(List.of());
    }

    private void calcularAlertasYEstados(Vehiculo v) {
        List<String> alertas = new ArrayList<>();
        List<Mantenimiento> mants = mantenimientoRepository.findByVehiculoId(v.getId());
        if (mants != null) {
            for (Mantenimiento m : mants) {
                if (m.getEstado() == Mantenimiento.EstadoMantenimiento.PROXIMO ||
                    m.getEstado() == Mantenimiento.EstadoMantenimiento.ATRASADO) {
                    
                    int kmRestantes = m.getKilometraje() - v.getKilometraje();
                    if (kmRestantes < 0) {
                        if (m.getEstado() != Mantenimiento.EstadoMantenimiento.ATRASADO) {
                            m.setEstado(Mantenimiento.EstadoMantenimiento.ATRASADO);
                            mantenimientoRepository.save(m);
                        }
                        alertas.add("¡Urgente! Mantenimiento de '" + m.getTipo() + "' vencido hace " + Math.abs(kmRestantes) + " km.");
                    } else if (kmRestantes <= 500) {
                        alertas.add("¡Aviso! Se aproxima el mantenimiento de '" + m.getTipo() + "' en " + kmRestantes + " km.");
                    }
                }
            }
        }

        // Auditoría de Vencimiento de Documentación Legal Chilena
        LocalDate hoy = LocalDate.now();
        try {
            if (v.getRevisionTecnicaVencimiento() != null && !v.getRevisionTecnicaVencimiento().isBlank()) {
                LocalDate fecPRT = LocalDate.parse(v.getRevisionTecnicaVencimiento());
                if (fecPRT.isBefore(hoy)) {
                    alertas.add("¡Infracción! Revisión Técnica vencida el " + v.getRevisionTecnicaVencimiento() + ".");
                } else if (fecPRT.isBefore(hoy.plusDays(30))) {
                    alertas.add("¡Aviso! Revisión Técnica vence pronto (" + v.getRevisionTecnicaVencimiento() + ").");
                }
            }
            if (v.getSoapVencimiento() != null && !v.getSoapVencimiento().isBlank()) {
                LocalDate fecSOAP = LocalDate.parse(v.getSoapVencimiento());
                if (fecSOAP.isBefore(hoy)) {
                    alertas.add("¡Infracción! Seguro Obligatorio (SOAP) vencido el " + v.getSoapVencimiento() + ".");
                }
            }
            if (v.getPermisoCirculacionVencimiento() != null && !v.getPermisoCirculacionVencimiento().isBlank()) {
                LocalDate fecPermiso = LocalDate.parse(v.getPermisoCirculacionVencimiento());
                if (fecPermiso.isBefore(hoy)) {
                    alertas.add("¡Infracción! Permiso de Circulación no vigente (venció " + v.getPermisoCirculacionVencimiento() + ").");
                }
            }
        } catch (Exception ignored) {}

        v.setAlertas(alertas);
    }
}
