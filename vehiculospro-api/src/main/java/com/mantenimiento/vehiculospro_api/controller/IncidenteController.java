package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.model.Incidente;
import com.mantenimiento.vehiculospro_api.repository.IncidenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/incidentes")
public class IncidenteController {

    @Autowired
    private IncidenteRepository incidenteRepository;

    @GetMapping
    public ResponseEntity<List<Incidente>> listarTodos() {
        return ResponseEntity.ok(incidenteRepository.findAllByOrderByTimestampDesc());
    }

    @PostMapping
    public ResponseEntity<Incidente> registrar(@RequestBody Incidente inc) {
        inc.setId(null); // Asegura inserción con auto_increment sin error de detached entity
        if (inc.getTimestamp() == null) {
            inc.setTimestamp(System.currentTimeMillis());
        }
        if (inc.getResuelto() == null) {
            inc.setResuelto(false);
        }
        Incidente guardado = incidenteRepository.save(inc);
        return new ResponseEntity<>(guardado, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/resolver")
    public ResponseEntity<Incidente> resolver(
            @PathVariable Long id, 
            @RequestParam(required = false) String resueltoPor) {
        return incidenteRepository.findById(id).map(inc -> {
            inc.setResuelto(true);
            inc.setFechaResolucion(LocalDateTime.now());
            if (resueltoPor != null && !resueltoPor.isBlank()) {
                inc.setResueltoPor(resueltoPor);
            }
            return ResponseEntity.ok(incidenteRepository.save(inc));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
