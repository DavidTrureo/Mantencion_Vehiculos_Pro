package com.mantenimiento.vehiculospro_api.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "vehiculos")
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String marca;
    private String modelo;
    private int anio;
    private int kilometraje;
    private String patente;
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;


    // Nuevo campo para almacenar el contenido del QR
    @Column(columnDefinition = "TEXT")
    private String qrCode;

    // ===== Documentación Legal Vehicular Chilena =====
    // 1. Revisión Técnica (PRT)
    @Column(name = "revision_tecnica_vencimiento", length = 50)
    private String revisionTecnicaVencimiento;

    @Column(name = "revision_tecnica_numero", length = 100)
    private String revisionTecnicaNumero;

    @Column(name = "revision_tecnica_imagen", columnDefinition = "TEXT")
    private String revisionTecnicaImagen;

    // 2. Seguro Obligatorio (SOAP)
    @Column(name = "soap_aseguradora", length = 100)
    private String soapAseguradora;

    @Column(name = "soap_vencimiento", length = 50)
    private String soapVencimiento;

    @Column(name = "soap_poliza", length = 100)
    private String soapPoliza;

    @Column(name = "soap_imagen", columnDefinition = "TEXT")
    private String soapImagen;

    // 3. Permiso de Circulación
    @Column(name = "permiso_circulacion_municipalidad", length = 150)
    private String permisoCirculacionMunicipalidad;

    @Column(name = "permiso_circulacion_vencimiento", length = 50)
    private String permisoCirculacionVencimiento;

    @Column(name = "permiso_circulacion_folio", length = 100)
    private String permisoCirculacionFolio;

    @Column(name = "permiso_circulacion_imagen", columnDefinition = "TEXT")
    private String permisoCirculacionImagen;

    // 4. Padrón del Vehículo (Registro Civil)
    @Column(name = "padron_folio", length = 100)
    private String padronFolio;

    @Column(name = "padron_vin", length = 100)
    private String padronVin;

    @Column(name = "padron_motor", length = 100)
    private String padronMotor;

    @Column(name = "padron_fecha_emision", length = 50)
    private String padronFechaEmision;

    @Column(name = "padron_imagen", columnDefinition = "TEXT")
    private String padronImagen;

    @ManyToOne
    @JoinColumn(name = "propietario_id")
    @JsonBackReference
    private Usuario propietario;

    @OneToMany(mappedBy = "vehiculo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Mantenimiento> mantenimientos;

    // ===== Getters y Setters =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }

    public String getModelo() { return modelo; }
    public void setModelo(String modelo) { this.modelo = modelo; }

    public int getAnio() { return anio; }
    public void setAnio(int anio) { this.anio = anio; }

    public int getKilometraje() { return kilometraje; }
    public void setKilometraje(int kilometraje) { this.kilometraje = kilometraje; }

    public Boolean getActivo() { return activo != null ? activo : true; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public String getPatente() { return patente; }
    public void setPatente(String patente) { this.patente = patente; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public String getRevisionTecnicaVencimiento() { return revisionTecnicaVencimiento; }
    public void setRevisionTecnicaVencimiento(String revisionTecnicaVencimiento) { this.revisionTecnicaVencimiento = revisionTecnicaVencimiento; }

    public String getRevisionTecnicaNumero() { return revisionTecnicaNumero; }
    public void setRevisionTecnicaNumero(String revisionTecnicaNumero) { this.revisionTecnicaNumero = revisionTecnicaNumero; }

    public String getRevisionTecnicaImagen() { return revisionTecnicaImagen; }
    public void setRevisionTecnicaImagen(String revisionTecnicaImagen) { this.revisionTecnicaImagen = revisionTecnicaImagen; }

    public String getSoapAseguradora() { return soapAseguradora; }
    public void setSoapAseguradora(String soapAseguradora) { this.soapAseguradora = soapAseguradora; }

    public String getSoapVencimiento() { return soapVencimiento; }
    public void setSoapVencimiento(String soapVencimiento) { this.soapVencimiento = soapVencimiento; }

    public String getSoapPoliza() { return soapPoliza; }
    public void setSoapPoliza(String soapPoliza) { this.soapPoliza = soapPoliza; }

    public String getSoapImagen() { return soapImagen; }
    public void setSoapImagen(String soapImagen) { this.soapImagen = soapImagen; }

    public String getPermisoCirculacionMunicipalidad() { return permisoCirculacionMunicipalidad; }
    public void setPermisoCirculacionMunicipalidad(String permisoCirculacionMunicipalidad) { this.permisoCirculacionMunicipalidad = permisoCirculacionMunicipalidad; }

    public String getPermisoCirculacionVencimiento() { return permisoCirculacionVencimiento; }
    public void setPermisoCirculacionVencimiento(String permisoCirculacionVencimiento) { this.permisoCirculacionVencimiento = permisoCirculacionVencimiento; }

    public String getPermisoCirculacionFolio() { return permisoCirculacionFolio; }
    public void setPermisoCirculacionFolio(String permisoCirculacionFolio) { this.permisoCirculacionFolio = permisoCirculacionFolio; }

    public String getPermisoCirculacionImagen() { return permisoCirculacionImagen; }
    public void setPermisoCirculacionImagen(String permisoCirculacionImagen) { this.permisoCirculacionImagen = permisoCirculacionImagen; }

    public String getPadronFolio() { return padronFolio; }
    public void setPadronFolio(String padronFolio) { this.padronFolio = padronFolio; }

    public String getPadronVin() { return padronVin; }
    public void setPadronVin(String padronVin) { this.padronVin = padronVin; }

    public String getPadronMotor() { return padronMotor; }
    public void setPadronMotor(String padronMotor) { this.padronMotor = padronMotor; }

    public String getPadronFechaEmision() { return padronFechaEmision; }
    public void setPadronFechaEmision(String padronFechaEmision) { this.padronFechaEmision = padronFechaEmision; }

    public String getPadronImagen() { return padronImagen; }
    public void setPadronImagen(String padronImagen) { this.padronImagen = padronImagen; }

    public Usuario getPropietario() { return propietario; }
    public void setPropietario(Usuario propietario) { this.propietario = propietario; }

    public List<Mantenimiento> getMantenimientos() { return mantenimientos; }
    public void setMantenimientos(List<Mantenimiento> mantenimientos) { this.mantenimientos = mantenimientos; }

    @Transient
    private List<String> alertas;

    public List<String> getAlertas() { return alertas; }
    public void setAlertas(List<String> alertas) { this.alertas = alertas; }
}
