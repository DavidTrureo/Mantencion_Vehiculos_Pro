package com.mantenimiento.vehiculospro_api.dto;

public class FinalizarTurnoDTO {
    private Integer kmFin;
    private Double kmGpsRecorridos;
    private Long finalizadorId; // ID del conductor o supervisor que cierra
    private Boolean esCierreAdministrativo;
    private Double latitudFin;
    private Double longitudFin;
    private String observaciones;

    public Integer getKmFin() { return kmFin; }
    public void setKmFin(Integer kmFin) { this.kmFin = kmFin; }

    public Double getKmGpsRecorridos() { return kmGpsRecorridos; }
    public void setKmGpsRecorridos(Double kmGpsRecorridos) { this.kmGpsRecorridos = kmGpsRecorridos; }

    public Long getFinalizadorId() { return finalizadorId; }
    public void setFinalizadorId(Long finalizadorId) { this.finalizadorId = finalizadorId; }

    public Boolean getEsCierreAdministrativo() { return esCierreAdministrativo != null ? esCierreAdministrativo : false; }
    public void setEsCierreAdministrativo(Boolean esCierreAdministrativo) { this.esCierreAdministrativo = esCierreAdministrativo; }

    public Double getLatitudFin() { return latitudFin; }
    public void setLatitudFin(Double latitudFin) { this.latitudFin = latitudFin; }

    public Double getLongitudFin() { return longitudFin; }
    public void setLongitudFin(Double longitudFin) { this.longitudFin = longitudFin; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
