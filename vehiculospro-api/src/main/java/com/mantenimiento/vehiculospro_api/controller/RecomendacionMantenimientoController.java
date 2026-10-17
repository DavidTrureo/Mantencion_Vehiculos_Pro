package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.model.RecomendacionMantenimiento;
import com.mantenimiento.vehiculospro_api.repository.RecomendacionMantenimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/recomendaciones", "/api/recomendaciones"})
@CrossOrigin(origins = "*")
public class RecomendacionMantenimientoController {

    @Autowired
    private RecomendacionMantenimientoRepository repository;

    @GetMapping
    public ResponseEntity<List<RecomendacionMantenimiento>> obtenerTodas() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<RecomendacionMantenimiento> obtenerPorTipo(@PathVariable String tipo) {
        return repository.findByTipoIgnoreCase(tipo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
