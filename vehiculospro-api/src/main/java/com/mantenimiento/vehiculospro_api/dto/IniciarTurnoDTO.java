package com.mantenimiento.vehiculospro_api.dto;

public class IniciarTurnoDTO {
    private Long vehiculoId;
    private Long conductorId;
    private Long iniciadorId; // ID del supervisor que despacha, o null si es el mismo conductor
    private Integer kmInicio;
    private String tipoSalida; // ej. REPARTO_DINAMICO, RUTA_FIJA
    private Double latitudInicio;
    private Double longitudInicio;
    private String observaciones;

    public Long getVehiculoId() { return vehiculoId; }
    public void setVehiculoId(Long vehiculoId) { this.vehiculoId = vehiculoId; }

    public Long getConductorId() { return conductorId; }
    public void setConductorId(Long conductorId) { this.conductorId = conductorId; }

    public Long getIniciadorId() { return iniciadorId; }
    public void setIniciadorId(Long iniciadorId) { this.iniciadorId = iniciadorId; }

    public Integer getKmInicio() { return kmInicio; }
    public void setKmInicio(Integer kmInicio) { this.kmInicio = kmInicio; }

    public String getTipoSalida() { return tipoSalida; }
    public void setTipoSalida(String tipoSalida) { this.tipoSalida = tipoSalida; }

    public Double getLatitudInicio() { return latitudInicio; }
    public void setLatitudInicio(Double latitudInicio) { this.latitudInicio = latitudInicio; }

    public Double getLongitudInicio() { return longitudInicio; }
    public void setLongitudInicio(Double longitudInicio) { this.longitudInicio = longitudInicio; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
