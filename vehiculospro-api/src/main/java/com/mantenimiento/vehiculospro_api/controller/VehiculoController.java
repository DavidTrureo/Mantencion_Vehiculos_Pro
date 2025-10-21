package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.dto.VehiculoDTO;
import com.mantenimiento.vehiculospro_api.mapper.VehiculoMapper;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import com.mantenimiento.vehiculospro_api.repository.VehiculoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<VehiculoDTO>> obtenerVehiculos(@PathVariable Long usuarioId) {
        List<Vehiculo> lista = vehiculoRepository.findByPropietarioId(usuarioId);
        List<VehiculoDTO> dtos = lista.stream()
                .map(VehiculoMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/usuario/{usuarioId}")
    public ResponseEntity<VehiculoDTO> crearVehiculo(
            @PathVariable Long usuarioId,
            @Valid @RequestBody VehiculoDTO dto
    ) {
        Usuario propietario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Vehiculo entidad = VehiculoMapper.toEntity(dto, propietario);
        Vehiculo guardado = vehiculoRepository.save(entidad);
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

        Vehiculo actualizado = vehiculoRepository.save(existente);
        return ResponseEntity.ok(VehiculoMapper.toDTO(actualizado));
    }

    @DeleteMapping("/{vehiculoId}")
    public ResponseEntity<Void> eliminarVehiculo(@PathVariable Long vehiculoId) {
        vehiculoRepository.deleteById(vehiculoId);
        return ResponseEntity.noContent().build();
    }
}