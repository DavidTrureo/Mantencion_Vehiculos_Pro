package com.mantenimiento.vehiculospro_api.dto;

public class ItemAlertaVencimientoDTO {
    private Long vehiculoId;
    private String patente;
    private String marcaModelo;
    private String documento;
    private String fechaVencimiento;
    private long diasRestantes;
    private String estado; // 'VENCIDO' o 'POR_VENCER'
    private String mensaje;

    public ItemAlertaVencimientoDTO() {}

    public ItemAlertaVencimientoDTO(Long vehiculoId, String patente, String marcaModelo, String documento, String fechaVencimiento, long diasRestantes, String estado, String mensaje) {
        this.vehiculoId = vehiculoId;
        this.patente = patente;
        this.marcaModelo = marcaModelo;
        this.documento = documento;
        this.fechaVencimiento = fechaVencimiento;
        this.diasRestantes = diasRestantes;
        this.estado = estado;
        this.mensaje = mensaje;
    }

    public Long getVehiculoId() { return vehiculoId; }
    public void setVehiculoId(Long vehiculoId) { this.vehiculoId = vehiculoId; }

    public String getPatente() { return patente; }
    public void setPatente(String patente) { this.patente = patente; }

    public String getMarcaModelo() { return marcaModelo; }
    public void setMarcaModelo(String marcaModelo) { this.marcaModelo = marcaModelo; }

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }

    public String getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(String fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }

    public long getDiasRestantes() { return diasRestantes; }
    public void setDiasRestantes(long diasRestantes) { this.diasRestantes = diasRestantes; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
}
