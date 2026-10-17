package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.dto.FinalizarTurnoDTO;
import com.mantenimiento.vehiculospro_api.dto.IniciarTurnoDTO;
import com.mantenimiento.vehiculospro_api.dto.TurnoResponseDTO;
import com.mantenimiento.vehiculospro_api.service.TurnoJornadaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/turnos")
public class TurnoJornadaController {

    @Autowired
    private TurnoJornadaService turnoService;

    @PostMapping("/iniciar")
    public ResponseEntity<TurnoResponseDTO> iniciarTurno(@RequestBody IniciarTurnoDTO dto) {
        return new ResponseEntity<>(turnoService.iniciarTurno(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/finalizar")
    public ResponseEntity<TurnoResponseDTO> finalizarTurno(
            @PathVariable Long id,
            @RequestBody FinalizarTurnoDTO dto) {
        return ResponseEntity.ok(turnoService.finalizarTurno(id, dto));
    }

    @GetMapping("/activo/vehiculo/{vehiculoId}")
    public ResponseEntity<TurnoResponseDTO> obtenerTurnoActivoVehiculo(@PathVariable Long vehiculoId) {
        return turnoService.obtenerTurnoActivoVehiculo(vehiculoId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/activo/conductor/{conductorId}")
    public ResponseEntity<TurnoResponseDTO> obtenerTurnoActivoConductor(@PathVariable Long conductorId) {
        return turnoService.obtenerTurnoActivoConductor(conductorId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/activos")
    public ResponseEntity<List<TurnoResponseDTO>> listarTurnosActivos() {
        return ResponseEntity.ok(turnoService.listarTurnosActivos());
    }

    @GetMapping("/historial/vehiculo/{vehiculoId}")
    public ResponseEntity<List<TurnoResponseDTO>> listarHistorialVehiculo(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(turnoService.listarHistorialVehiculo(vehiculoId));
    }

    @GetMapping("/historial/conductor/{conductorId}")
    public ResponseEntity<List<TurnoResponseDTO>> listarHistorialConductor(@PathVariable Long conductorId) {
        return ResponseEntity.ok(turnoService.listarHistorialConductor(conductorId));
    }

    @GetMapping("/recientes")
    public ResponseEntity<List<TurnoResponseDTO>> listarTurnosRecientes() {
        return ResponseEntity.ok(turnoService.listarTurnosRecientes());
    }
}
