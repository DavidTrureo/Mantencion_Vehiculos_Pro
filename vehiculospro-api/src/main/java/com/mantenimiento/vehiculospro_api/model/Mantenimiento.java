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
}