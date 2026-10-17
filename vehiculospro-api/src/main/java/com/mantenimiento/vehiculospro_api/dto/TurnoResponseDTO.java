package com.mantenimiento.vehiculospro_api.dto;

import java.time.LocalDateTime;

public class TurnoResponseDTO {
    private Long id;
    private Long vehiculoId;
    private String vehiculoPatente;
    private String vehiculoMarca;
    private String vehiculoModelo;
    private Long conductorId;
    private String conductorNombre;
    private String conductorRut;
    private Long iniciadoPorId;
    private String iniciadoPorNombre;
    private Long cerradoPorId;
    private String cerradoPorNombre;
    private Integer kmInicio;
    private Integer kmFin;
    private Double kmGpsRecorridos;
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private String estado;
    private String tipoSalida;
    private Boolean esCierreAdministrativo;
    private String observaciones;
    private Double latitudInicio;
    private Double longitudInicio;
    private Double latitudFin;
    private Double longitudFin;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVehiculoId() { return vehiculoId; }
    public void setVehiculoId(Long vehiculoId) { this.vehiculoId = vehiculoId; }

    public String getVehiculoPatente() { return vehiculoPatente; }
    public void setVehiculoPatente(String vehiculoPatente) { this.vehiculoPatente = vehiculoPatente; }

    public String getVehiculoMarca() { return vehiculoMarca; }
    public void setVehiculoMarca(String vehiculoMarca) { this.vehiculoMarca = vehiculoMarca; }

    public String getVehiculoModelo() { return vehiculoModelo; }
    public void setVehiculoModelo(String vehiculoModelo) { this.vehiculoModelo = vehiculoModelo; }

    public Long getConductorId() { return conductorId; }
    public void setConductorId(Long conductorId) { this.conductorId = conductorId; }

    public String getConductorNombre() { return conductorNombre; }
    public void setConductorNombre(String conductorNombre) { this.conductorNombre = conductorNombre; }

    public String getConductorRut() { return conductorRut; }
    public void setConductorRut(String conductorRut) { this.conductorRut = conductorRut; }

    public Long getIniciadoPorId() { return iniciadoPorId; }
    public void setIniciadoPorId(Long iniciadoPorId) { this.iniciadoPorId = iniciadoPorId; }

    public String getIniciadoPorNombre() { return iniciadoPorNombre; }
    public void setIniciadoPorNombre(String iniciadoPorNombre) { this.iniciadoPorNombre = iniciadoPorNombre; }

    public Long getCerradoPorId() { return cerradoPorId; }
    public void setCerradoPorId(Long cerradoPorId) { this.cerradoPorId = cerradoPorId; }

    public String getCerradoPorNombre() { return cerradoPorNombre; }
    public void setCerradoPorNombre(String cerradoPorNombre) { this.cerradoPorNombre = cerradoPorNombre; }

    public Integer getKmInicio() { return kmInicio; }
    public void setKmInicio(Integer kmInicio) { this.kmInicio = kmInicio; }

    public Integer getKmFin() { return kmFin; }
    public void setKmFin(Integer kmFin) { this.kmFin = kmFin; }

    public Double getKmGpsRecorridos() { return kmGpsRecorridos; }
    public void setKmGpsRecorridos(Double kmGpsRecorridos) { this.kmGpsRecorridos = kmGpsRecorridos; }

    public LocalDateTime getFechaHoraInicio() { return fechaHoraInicio; }
    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }

    public LocalDateTime getFechaHoraFin() { return fechaHoraFin; }
    public void setFechaHoraFin(LocalDateTime fechaHoraFin) { this.fechaHoraFin = fechaHoraFin; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getTipoSalida() { return tipoSalida; }
    public void setTipoSalida(String tipoSalida) { this.tipoSalida = tipoSalida; }

    public Boolean getEsCierreAdministrativo() { return esCierreAdministrativo; }
    public void setEsCierreAdministrativo(Boolean esCierreAdministrativo) { this.esCierreAdministrativo = esCierreAdministrativo; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public Double getLatitudInicio() { return latitudInicio; }
    public void setLatitudInicio(Double latitudInicio) { this.latitudInicio = latitudInicio; }

    public Double getLongitudInicio() { return longitudInicio; }
    public void setLongitudInicio(Double longitudInicio) { this.longitudInicio = longitudInicio; }

    public Double getLatitudFin() { return latitudFin; }
    public void setLatitudFin(Double latitudFin) { this.latitudFin = latitudFin; }

    public Double getLongitudFin() { return longitudFin; }
    public void setLongitudFin(Double longitudFin) { this.longitudFin = longitudFin; }
}
