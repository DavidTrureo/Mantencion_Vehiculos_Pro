package com.mantenimiento.vehiculospro_api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidentes")
public class Incidente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long vehiculoId;
    private String vehiculoNombre;
    private String patente;

    private Long conductorId;
    private String conductorNombre;
    private String conductorTelefono;

    private String tipoEvento;
    private String gravedad;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(columnDefinition = "TEXT")
    private String foto;

    private String fechaHoraStr;
    private Long timestamp;

    private Boolean resuelto = false;
    private LocalDateTime fechaResolucion;
    private String resueltoPor;

    public Incidente() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVehiculoId() { return vehiculoId; }
    public void setVehiculoId(Long vehiculoId) { this.vehiculoId = vehiculoId; }

    public String getVehiculoNombre() { return vehiculoNombre; }
    public void setVehiculoNombre(String vehiculoNombre) { this.vehiculoNombre = vehiculoNombre; }

    public String getPatente() { return patente; }
    public void setPatente(String patente) { this.patente = patente; }

    public Long getConductorId() { return conductorId; }
    public void setConductorId(Long conductorId) { this.conductorId = conductorId; }

    public String getConductorNombre() { return conductorNombre; }
    public void setConductorNombre(String conductorNombre) { this.conductorNombre = conductorNombre; }

    public String getConductorTelefono() { return conductorTelefono; }
    public void setConductorTelefono(String conductorTelefono) { this.conductorTelefono = conductorTelefono; }

    public String getTipoEvento() { return tipoEvento; }
    public void setTipoEvento(String tipoEvento) { this.tipoEvento = tipoEvento; }

    public String getGravedad() { return gravedad; }
    public void setGravedad(String gravedad) { this.gravedad = gravedad; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getFoto() { return foto; }
    public void setFoto(String foto) { this.foto = foto; }

    public String getFechaHoraStr() { return fechaHoraStr; }
    public void setFechaHoraStr(String fechaHoraStr) { this.fechaHoraStr = fechaHoraStr; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public Boolean getResuelto() { return resuelto; }
    public void setResuelto(Boolean resuelto) { this.resuelto = resuelto; }

    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(LocalDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }

    public String getResueltoPor() { return resueltoPor; }
    public void setResueltoPor(String resueltoPor) { this.resueltoPor = resueltoPor; }
}
