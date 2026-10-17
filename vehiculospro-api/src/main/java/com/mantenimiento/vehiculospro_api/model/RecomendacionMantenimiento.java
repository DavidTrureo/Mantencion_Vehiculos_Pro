package com.mantenimiento.vehiculospro_api.model;

import jakarta.persistence.*;

@Entity
@Table(name = "recomendaciones_mantenimiento")
public class RecomendacionMantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tipo;

    @Column(nullable = false)
    private int minKm;

    @Column(nullable = false)
    private int maxKm;

    @Column(nullable = false, length = 500)
    private String consejo;

    // Constructors
    public RecomendacionMantenimiento() {}

    public RecomendacionMantenimiento(String tipo, int minKm, int maxKm, String consejo) {
        this.tipo = tipo;
        this.minKm = minKm;
        this.maxKm = maxKm;
        this.consejo = consejo;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public int getMinKm() { return minKm; }
    public void setMinKm(int minKm) { this.minKm = minKm; }

    public int getMaxKm() { return maxKm; }
    public void setMaxKm(int maxKm) { this.maxKm = maxKm; }

    public String getConsejo() { return consejo; }
    public void setConsejo(String consejo) { this.consejo = consejo; }
}
