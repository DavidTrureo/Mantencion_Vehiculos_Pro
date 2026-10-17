package com.mantenimiento.vehiculospro_api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "mantenimientos")
public class Mantenimiento {

    public enum EstadoMantenimiento {
        REALIZADO, // Verde
        PROXIMO,   // Amarillo
        ATRASADO   // Rojo
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tipo;

    private String descripcion;
    private LocalDate fecha;
    private int kilometraje;

    @Enumerated(EnumType.STRING) // Guarda el estado como texto (ej. "REALIZADO")
    private EstadoMantenimiento estado;

    private Double costo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehiculo_id")
    @JsonIgnore
    private Vehiculo vehiculo;

    // Getters y Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public int getKilometraje() { return kilometraje; }
    public void setKilometraje(int kilometraje) { this.kilometraje = kilometraje; }

    public EstadoMantenimiento getEstado() { return estado; }
    public void setEstado(EstadoMantenimiento estado) { this.estado = estado; }

    public Vehiculo getVehiculo() { return vehiculo; }
    public void setVehiculo(Vehiculo vehiculo) { this.vehiculo = vehiculo; }

    public Double getCosto() { return costo; }
    public void setCosto(Double costo) { this.costo = costo; }

    @Column(name = "factura_imagen", columnDefinition = "TEXT")
    private String facturaImagen;

    public String getFacturaImagen() { return facturaImagen; }
    public void setFacturaImagen(String facturaImagen) { this.facturaImagen = facturaImagen; }

    @Column(name = "evidencia_foto_url", length = 500)
    private String evidenciaFotoUrl;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    public String getEvidenciaFotoUrl() { return evidenciaFotoUrl; }
    public void setEvidenciaFotoUrl(String evidenciaFotoUrl) { this.evidenciaFotoUrl = evidenciaFotoUrl; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    @Column(name = "latitud")
    private Double latitud;

    @Column(name = "longitud")
    private Double longitud;

    public Double getLatitud() { return latitud; }
    public void setLatitud(Double latitud) { this.latitud = latitud; }

    public Double getLongitud() { return longitud; }
    public void setLongitud(Double longitud) { this.longitud = longitud; }

    @Column(name = "mecanico_id")
    private Long mecanicoId;

    public Long getMecanicoId() { return mecanicoId; }
    public void setMecanicoId(Long mecanicoId) { this.mecanicoId = mecanicoId; }
}