package com.mantenimiento.vehiculospro_api.mapper;

import com.mantenimiento.vehiculospro_api.dto.VehiculoDTO;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import com.mantenimiento.vehiculospro_api.model.Usuario;

public class VehiculoMapper {

    public static VehiculoDTO toDTO(Vehiculo v) {
        VehiculoDTO dto = new VehiculoDTO();
        dto.setId(v.getId());
        dto.setMarca(v.getMarca());
        dto.setModelo(v.getModelo());
        dto.setAnio(v.getAnio());
        dto.setKilometraje(v.getKilometraje());
        if (v.getPropietario() != null) {
            dto.setPropietarioId(v.getPropietario().getId());
            String nombre = v.getPropietario().getFullName();
            if (nombre == null || nombre.isBlank()) {
                nombre = v.getPropietario().getUsername();
            }
            dto.setPropietarioNombre(nombre);
        }
        dto.setQrCode(v.getQrCode());
        dto.setPatente(v.getPatente());
        dto.setActivo(v.getActivo());
        dto.setAlertas(v.getAlertas());

        // Documentación Legal Chilena completa (con imagen)
        dto.setRevisionTecnicaVencimiento(v.getRevisionTecnicaVencimiento());
        dto.setRevisionTecnicaNumero(v.getRevisionTecnicaNumero());
        dto.setRevisionTecnicaImagen(v.getRevisionTecnicaImagen());

        dto.setSoapAseguradora(v.getSoapAseguradora());
        dto.setSoapVencimiento(v.getSoapVencimiento());
        dto.setSoapPoliza(v.getSoapPoliza());
        dto.setSoapImagen(v.getSoapImagen());

        dto.setPermisoCirculacionMunicipalidad(v.getPermisoCirculacionMunicipalidad());
        dto.setPermisoCirculacionVencimiento(v.getPermisoCirculacionVencimiento());
        dto.setPermisoCirculacionFolio(v.getPermisoCirculacionFolio());
        dto.setPermisoCirculacionImagen(v.getPermisoCirculacionImagen());

        // 4. Padrón del Vehículo
        dto.setPadronFolio(v.getPadronFolio());
        dto.setPadronVin(v.getPadronVin());
        dto.setPadronMotor(v.getPadronMotor());
        dto.setPadronFechaEmision(v.getPadronFechaEmision());
        dto.setPadronImagen(v.getPadronImagen());

        return dto;
    }

    private static String toLightDoc(String val) {
        if (val == null || val.isBlank()) return null;
        if (val.startsWith("http://") || val.startsWith("https://")) {
            return val;
        }
        return "PRESENT";
    }

    public static VehiculoDTO toLightDTO(Vehiculo v) {
        VehiculoDTO dto = new VehiculoDTO();
        dto.setId(v.getId());
        dto.setMarca(v.getMarca());
        dto.setModelo(v.getModelo());
        dto.setAnio(v.getAnio());
        dto.setKilometraje(v.getKilometraje());
        if (v.getPropietario() != null) {
            dto.setPropietarioId(v.getPropietario().getId());
            String nombre = v.getPropietario().getFullName();
            if (nombre == null || nombre.isBlank()) {
                nombre = v.getPropietario().getUsername();
            }
            dto.setPropietarioNombre(nombre);
        }
        dto.setQrCode(v.getQrCode());
        dto.setPatente(v.getPatente());
        dto.setActivo(v.getActivo());
        dto.setAlertas(v.getAlertas());

        // Metadatos de Documentación Legal Chilena (Sin cargar los megabytes de Base64)
        dto.setRevisionTecnicaVencimiento(v.getRevisionTecnicaVencimiento());
        dto.setRevisionTecnicaNumero(v.getRevisionTecnicaNumero());
        dto.setRevisionTecnicaImagen(toLightDoc(v.getRevisionTecnicaImagen()));

        dto.setSoapAseguradora(v.getSoapAseguradora());
        dto.setSoapVencimiento(v.getSoapVencimiento());
        dto.setSoapPoliza(v.getSoapPoliza());
        dto.setSoapImagen(toLightDoc(v.getSoapImagen()));

        dto.setPermisoCirculacionMunicipalidad(v.getPermisoCirculacionMunicipalidad());
        dto.setPermisoCirculacionVencimiento(v.getPermisoCirculacionVencimiento());
        dto.setPermisoCirculacionFolio(v.getPermisoCirculacionFolio());
        dto.setPermisoCirculacionImagen(toLightDoc(v.getPermisoCirculacionImagen()));

        // 4. Padrón del Vehículo
        dto.setPadronFolio(v.getPadronFolio());
        dto.setPadronVin(v.getPadronVin());
        dto.setPadronMotor(v.getPadronMotor());
        dto.setPadronFechaEmision(v.getPadronFechaEmision());
        dto.setPadronImagen(toLightDoc(v.getPadronImagen()));

        return dto;
    }

    public static Vehiculo toEntity(VehiculoDTO dto, Usuario propietario) {
        Vehiculo v = new Vehiculo();
        v.setId(dto.getId());
        v.setMarca(dto.getMarca());
        v.setModelo(dto.getModelo());
        v.setAnio(dto.getAnio());
        v.setKilometraje(dto.getKilometraje());
        v.setPropietario(propietario);
        v.setQrCode(dto.getQrCode());
        v.setPatente(dto.getPatente());
        v.setActivo(dto.getActivo() != null ? dto.getActivo() : true);

        // Documentación Legal Chilena
        v.setRevisionTecnicaVencimiento(dto.getRevisionTecnicaVencimiento());
        v.setRevisionTecnicaNumero(dto.getRevisionTecnicaNumero());
        if (dto.getRevisionTecnicaImagen() != null && !"PRESENT".equals(dto.getRevisionTecnicaImagen())) {
            v.setRevisionTecnicaImagen(dto.getRevisionTecnicaImagen());
        }

        v.setSoapAseguradora(dto.getSoapAseguradora());
        v.setSoapVencimiento(dto.getSoapVencimiento());
        v.setSoapPoliza(dto.getSoapPoliza());
        if (dto.getSoapImagen() != null && !"PRESENT".equals(dto.getSoapImagen())) {
            v.setSoapImagen(dto.getSoapImagen());
        }

        v.setPermisoCirculacionMunicipalidad(dto.getPermisoCirculacionMunicipalidad());
        v.setPermisoCirculacionVencimiento(dto.getPermisoCirculacionVencimiento());
        v.setPermisoCirculacionFolio(dto.getPermisoCirculacionFolio());
        if (dto.getPermisoCirculacionImagen() != null && !"PRESENT".equals(dto.getPermisoCirculacionImagen())) {
            v.setPermisoCirculacionImagen(dto.getPermisoCirculacionImagen());
        }

        // 4. Padrón del Vehículo
        v.setPadronFolio(dto.getPadronFolio());
        v.setPadronVin(dto.getPadronVin());
        v.setPadronMotor(dto.getPadronMotor());
        v.setPadronFechaEmision(dto.getPadronFechaEmision());
        if (dto.getPadronImagen() != null && !"PRESENT".equals(dto.getPadronImagen())) {
            v.setPadronImagen(dto.getPadronImagen());
        }

        return v;
    }
}
