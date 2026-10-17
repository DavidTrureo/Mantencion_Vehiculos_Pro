package com.mantenimiento.vehiculospro_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.util.List;

public class VehiculoDTO {

    private Long id;

    @NotBlank(message = "La marca es obligatoria")
    private String marca;

    @NotBlank(message = "El modelo es obligatorio")
    private String modelo;

    @NotNull(message = "El año es obligatorio")
    @Min(value = 1900, message = "El año debe ser mayor a 1900")
    private int anio;

    @Min(value = 0, message = "El kilometraje no puede ser negativo")
    private int kilometraje;

    private String patente;
    private Boolean activo = true;

    // propietarioId es asignado via path variable o dto
    private Long propietarioId;
    private String propietarioNombre;

    // Nuevo campo para devolver el QR al frontend
    private String qrCode;

    // ===== Documentación Legal Vehicular Chilena =====
    // 1. Revisión Técnica (PRT)
    private String revisionTecnicaVencimiento;
    private String revisionTecnicaNumero;
    private String revisionTecnicaImagen;

    // 2. Seguro Obligatorio (SOAP)
    private String soapAseguradora;
    private String soapVencimiento;
    private String soapPoliza;
    private String soapImagen;

    // 3. Permiso de Circulación
    private String permisoCirculacionMunicipalidad;
    private String permisoCirculacionVencimiento;
    private String permisoCirculacionFolio;
    private String permisoCirculacionImagen;

    // 4. Padrón del Vehículo (Registro Civil)
    private String padronFolio;
    private String padronVin;
    private String padronMotor;
    private String padronFechaEmision;
    private String padronImagen;

    private List<String> alertas;

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


    public Long getPropietarioId() { return propietarioId; }
    public void setPropietarioId(Long propietarioId) { this.propietarioId = propietarioId; }

    public String getPropietarioNombre() { return propietarioNombre; }
    public void setPropietarioNombre(String propietarioNombre) { this.propietarioNombre = propietarioNombre; }

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

    public List<String> getAlertas() { return alertas; }
    public void setAlertas(List<String> alertas) { this.alertas = alertas; }
}
