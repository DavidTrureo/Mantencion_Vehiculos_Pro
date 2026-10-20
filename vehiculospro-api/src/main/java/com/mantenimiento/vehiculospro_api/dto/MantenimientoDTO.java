package com.mantenimiento.vehiculospro_api.dto;

import com.mantenimiento.vehiculospro_api.model.Mantenimiento.EstadoMantenimiento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

public class MantenimientoDTO {

    private Long id;

    @NotBlank(message = "El tipo de mantenimiento es obligatorio")
    private String tipo;

    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;

    private String fecha; // Formato esperado: "yyyy-MM-dd"

    @Min(value = 0, message = "El kilometraje no puede ser negativo")
    private int kilometraje;

    @NotNull(message = "El estado es obligatorio")
    private EstadoMantenimiento estado;

    @NotNull(message = "El vehículo es obligatorio")
    private Long vehiculoId;

    private Double costo;

    // Getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public int getKilometraje() { return kilometraje; }
    public void setKilometraje(int kilometraje) { this.kilometraje = kilometraje; }

    public EstadoMantenimiento getEstado() { return estado; }
    public void setEstado(EstadoMantenimiento estado) { this.estado = estado; }

    public Long getVehiculoId() { return vehiculoId; }
    public void setVehiculoId(Long vehiculoId) { this.vehiculoId = vehiculoId; }

    public Double getCosto() { return costo; }
    public void setCosto(Double costo) { this.costo = costo; }

    private String facturaImagen;

    public String getFacturaImagen() { return facturaImagen; }
    public void setFacturaImagen(String facturaImagen) { this.facturaImagen = facturaImagen; }

    private String evidenciaFotoUrl;
    private String audioUrl;

    public String getEvidenciaFotoUrl() { return evidenciaFotoUrl; }
    public void setEvidenciaFotoUrl(String evidenciaFotoUrl) { this.evidenciaFotoUrl = evidenciaFotoUrl; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    private Double latitud;
    private Double longitud;

    public Double getLatitud() { return latitud; }
    public void setLatitud(Double latitud) { this.latitud = latitud; }

    public Double getLongitud() { return longitud; }
    public void setLongitud(Double longitud) { this.longitud = longitud; }

    private String clasificacion; // 'PREVENTIVO' o 'CORRECTIVO'

    public String getClasificacion() { return clasificacion; }
    public void setClasificacion(String clasificacion) { this.clasificacion = clasificacion; }
}