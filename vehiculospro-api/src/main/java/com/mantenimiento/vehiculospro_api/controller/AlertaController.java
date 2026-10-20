package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.dto.ReporteAlertaVencimientosDTO;
import com.mantenimiento.vehiculospro_api.service.AlertaVencimientoScheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {

    @Autowired
    private AlertaVencimientoScheduler alertaScheduler;

    /**
     * Endpoint para ejecutar manualmente la auditoría de vencimientos legales
     * y despachar los correos y notificaciones push de inmediato.
     */
    @PostMapping("/vencimientos/ejecutar")
    public ResponseEntity<ReporteAlertaVencimientosDTO> ejecutarAuditoriaManual() {
        ReporteAlertaVencimientosDTO reporte = alertaScheduler.ejecutarChequeoVencimientos();
        return ResponseEntity.ok(reporte);
    }
}
