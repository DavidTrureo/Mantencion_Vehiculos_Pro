package com.mantenimiento.vehiculospro_api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "turnos_jornadas")
public class TurnoJornada {

    public enum EstadoTurno {
        EN_RUTA,
        FINALIZADO,
        CANCELADO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conductor_id", nullable = false)
    private Usuario conductor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "iniciado_por_id")
    private Usuario iniciadoPor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cerrado_por_id")
    private Usuario cerradoPor;

    @Column(name = "km_inicio", nullable = false)
    private Integer kmInicio;

    @Column(name = "km_fin")
    private Integer kmFin;

    @Column(name = "km_gps_recorridos")
    private Double kmGpsRecorridos = 0.0;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;

    @Column(name = "fecha_hora_fin")
    private LocalDateTime fechaHoraFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 30, nullable = false)
    private EstadoTurno estado = EstadoTurno.EN_RUTA;

    @Column(name = "tipo_salida", length = 50)
    private String tipoSalida;

    @Column(name = "es_cierre_administrativo")
    private Boolean esCierreAdministrativo = false;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @Column(name = "latitud_inicio")
    private Double latitudInicio;

    @Column(name = "longitud_inicio")
    private Double longitudInicio;

    @Column(name = "latitud_fin")
    private Double latitudFin;

    @Column(name = "longitud_fin")
    private Double longitudFin;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Vehiculo getVehiculo() { return vehiculo; }
    public void setVehiculo(Vehiculo vehiculo) { this.vehiculo = vehiculo; }

    public Usuario getConductor() { return conductor; }
    public void setConductor(Usuario conductor) { this.conductor = conductor; }

    public Usuario getIniciadoPor() { return iniciadoPor; }
    public void setIniciadoPor(Usuario iniciadoPor) { this.iniciadoPor = iniciadoPor; }

    public Usuario getCerradoPor() { return cerradoPor; }
    public void setCerradoPor(Usuario cerradoPor) { this.cerradoPor = cerradoPor; }

    public Integer getKmInicio() { return kmInicio; }
    public void setKmInicio(Integer kmInicio) { this.kmInicio = kmInicio; }

    public Integer getKmFin() { return kmFin; }
    public void setKmFin(Integer kmFin) { this.kmFin = kmFin; }

    public Double getKmGpsRecorridos() { return kmGpsRecorridos != null ? kmGpsRecorridos : 0.0; }
    public void setKmGpsRecorridos(Double kmGpsRecorridos) { this.kmGpsRecorridos = kmGpsRecorridos; }

    public LocalDateTime getFechaHoraInicio() { return fechaHoraInicio; }
    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }

    public LocalDateTime getFechaHoraFin() { return fechaHoraFin; }
    public void setFechaHoraFin(LocalDateTime fechaHoraFin) { this.fechaHoraFin = fechaHoraFin; }

    public EstadoTurno getEstado() { return estado; }
    public void setEstado(EstadoTurno estado) { this.estado = estado; }

    public String getTipoSalida() { return tipoSalida; }
    public void setTipoSalida(String tipoSalida) { this.tipoSalida = tipoSalida; }

    public Boolean getEsCierreAdministrativo() { return esCierreAdministrativo != null ? esCierreAdministrativo : false; }
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
