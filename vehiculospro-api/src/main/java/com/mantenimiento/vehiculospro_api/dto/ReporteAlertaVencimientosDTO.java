package com.mantenimiento.vehiculospro_api.dto;

import java.util.ArrayList;
import java.util.List;

public class ReporteAlertaVencimientosDTO {
    private String fechaChequeo;
    private int totalVehiculosEvaluados;
    private int totalAlertas;
    private int emailsEnviados;
    private int pushEnviados;
    private List<ItemAlertaVencimientoDTO> alertas = new ArrayList<>();

    public ReporteAlertaVencimientosDTO() {}

    public String getFechaChequeo() { return fechaChequeo; }
    public void setFechaChequeo(String fechaChequeo) { this.fechaChequeo = fechaChequeo; }

    public int getTotalVehiculosEvaluados() { return totalVehiculosEvaluados; }
    public void setTotalVehiculosEvaluados(int totalVehiculosEvaluados) { this.totalVehiculosEvaluados = totalVehiculosEvaluados; }

    public int getTotalAlertas() { return totalAlertas; }
    public void setTotalAlertas(int totalAlertas) { this.totalAlertas = totalAlertas; }

    public int getEmailsEnviados() { return emailsEnviados; }
    public void setEmailsEnviados(int emailsEnviados) { this.emailsEnviados = emailsEnviados; }

    public int getPushEnviados() { return pushEnviados; }
    public void setPushEnviados(int pushEnviados) { this.pushEnviados = pushEnviados; }

    public List<ItemAlertaVencimientoDTO> getAlertas() { return alertas; }
    public void setAlertas(List<ItemAlertaVencimientoDTO> alertas) { this.alertas = alertas; }
}
