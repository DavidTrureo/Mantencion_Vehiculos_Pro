package com.mantenimiento.vehiculospro_api.service;

import com.mantenimiento.vehiculospro_api.dto.FinalizarTurnoDTO;
import com.mantenimiento.vehiculospro_api.dto.IniciarTurnoDTO;
import com.mantenimiento.vehiculospro_api.dto.TurnoResponseDTO;
import com.mantenimiento.vehiculospro_api.exception.BadRequestException;
import com.mantenimiento.vehiculospro_api.exception.ResourceNotFoundException;
import com.mantenimiento.vehiculospro_api.model.TurnoJornada;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import com.mantenimiento.vehiculospro_api.repository.TurnoJornadaRepository;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import com.mantenimiento.vehiculospro_api.repository.VehiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TurnoJornadaService {

    @Autowired
    private TurnoJornadaRepository turnoRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Transactional
    public TurnoResponseDTO iniciarTurno(IniciarTurnoDTO dto) {
        if (dto.getVehiculoId() == null || dto.getConductorId() == null) {
            throw new BadRequestException("Los identificadores de vehículo y conductor son obligatorios.");
        }

        Vehiculo vehiculo = vehiculoRepository.findById(dto.getVehiculoId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado con ID: " + dto.getVehiculoId()));

        if (!vehiculo.getActivo()) {
            throw new BadRequestException("No se puede iniciar turno en un vehículo inactivo o dado de baja.");
        }

        Usuario conductor = usuarioRepository.findById(dto.getConductorId())
                .orElseThrow(() -> new ResourceNotFoundException("Conductor no encontrado con ID: " + dto.getConductorId()));

        if (conductor.getStatus() != 1) {
            throw new BadRequestException("El conductor seleccionado está inactivo.");
        }

        // Validación anti-colisión: ¿El vehículo ya está ocupado en otro turno activo?
        Optional<TurnoJornada> turnoVehiculoActivo = turnoRepository.findFirstByVehiculoIdAndEstado(
                vehiculo.getId(), TurnoJornada.EstadoTurno.EN_RUTA
        );
        if (turnoVehiculoActivo.isPresent()) {
            throw new BadRequestException("El móvil (" + vehiculo.getPatente() + ") ya tiene un turno en curso con " 
                    + (turnoVehiculoActivo.get().getConductor() != null ? turnoVehiculoActivo.get().getConductor().getFullName() : "otro conductor") + ".");
        }

        // Validación anti-colisión: ¿El conductor ya tiene otro vehículo tomado?
        Optional<TurnoJornada> turnoConductorActivo = turnoRepository.findFirstByConductorIdAndEstado(
                conductor.getId(), TurnoJornada.EstadoTurno.EN_RUTA
        );
        if (turnoConductorActivo.isPresent()) {
            throw new BadRequestException("El conductor " + conductor.getFullName() + " ya tiene un turno en curso con el móvil patente "
                    + (turnoConductorActivo.get().getVehiculo() != null ? turnoConductorActivo.get().getVehiculo().getPatente() : "") + ".");
        }

        Usuario iniciador = null;
        if (dto.getIniciadorId() != null) {
            iniciador = usuarioRepository.findById(dto.getIniciadorId()).orElse(null);
        }

        Integer kmInicio = (dto.getKmInicio() != null && dto.getKmInicio() > 0) ? dto.getKmInicio() : vehiculo.getKilometraje();

        TurnoJornada nuevoTurno = new TurnoJornada();
        nuevoTurno.setVehiculo(vehiculo);
        nuevoTurno.setConductor(conductor);
        nuevoTurno.setIniciadoPor(iniciador != null ? iniciador : conductor);
        nuevoTurno.setKmInicio(kmInicio);
        nuevoTurno.setKmGpsRecorridos(0.0);
        nuevoTurno.setFechaHoraInicio(LocalDateTime.now());
        nuevoTurno.setEstado(TurnoJornada.EstadoTurno.EN_RUTA);
        nuevoTurno.setTipoSalida(dto.getTipoSalida() != null ? dto.getTipoSalida() : "REPARTO_DINAMICO");
        nuevoTurno.setObservaciones(dto.getObservaciones());
        nuevoTurno.setLatitudInicio(dto.getLatitudInicio());
        nuevoTurno.setLongitudInicio(dto.getLongitudInicio());
        nuevoTurno.setEsCierreAdministrativo(false);

        // Actualizar asignación del vehículo al conductor actual
        vehiculo.setPropietario(conductor);
        vehiculoRepository.save(vehiculo);

        TurnoJornada guardado = turnoRepository.save(nuevoTurno);
        return mapToDTO(guardado);
    }

    @Transactional
    public TurnoResponseDTO finalizarTurno(Long turnoId, FinalizarTurnoDTO dto) {
        TurnoJornada turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado con ID: " + turnoId));

        if (turno.getEstado() != TurnoJornada.EstadoTurno.EN_RUTA) {
            throw new BadRequestException("El turno #" + turnoId + " ya fue finalizado previamente o cancelado.");
        }

        Vehiculo vehiculo = turno.getVehiculo();
        int kmInicio = turno.getKmInicio();
        double gpsKm = (dto.getKmGpsRecorridos() != null) ? dto.getKmGpsRecorridos() : 0.0;
        int kmFinal = (dto.getKmFin() != null && dto.getKmFin() >= kmInicio) 
                ? dto.getKmFin() 
                : (int) Math.round(kmInicio + gpsKm);

        turno.setKmFin(kmFinal);
        turno.setKmGpsRecorridos(gpsKm);
        turno.setFechaHoraFin(LocalDateTime.now());
        turno.setEstado(TurnoJornada.EstadoTurno.FINALIZADO);
        turno.setLatitudFin(dto.getLatitudFin());
        turno.setLongitudFin(dto.getLongitudFin());
        turno.setEsCierreAdministrativo(dto.getEsCierreAdministrativo());

        if (dto.getObservaciones() != null && !dto.getObservaciones().isBlank()) {
            String obsActual = turno.getObservaciones() != null ? turno.getObservaciones() + " | " : "";
            turno.setObservaciones(obsActual + dto.getObservaciones());
        }

        if (dto.getFinalizadorId() != null) {
            usuarioRepository.findById(dto.getFinalizadorId()).ifPresent(turno::setCerradoPor);
        }

        // Actualizar odómetro del vehículo en BD y liberar la asignación
        if (vehiculo != null) {
            if (kmFinal > vehiculo.getKilometraje()) {
                vehiculo.setKilometraje(kmFinal);
            }
            // Liberar asignación para el siguiente turno
            vehiculo.setPropietario(null);
            vehiculoRepository.save(vehiculo);
        }

        TurnoJornada guardado = turnoRepository.save(turno);
        return mapToDTO(guardado);
    }

    public Optional<TurnoResponseDTO> obtenerTurnoActivoVehiculo(Long vehiculoId) {
        return turnoRepository.findFirstByVehiculoIdAndEstado(vehiculoId, TurnoJornada.EstadoTurno.EN_RUTA)
                .map(this::mapToDTO);
    }

    public Optional<TurnoResponseDTO> obtenerTurnoActivoConductor(Long conductorId) {
        return turnoRepository.findFirstByConductorIdAndEstado(conductorId, TurnoJornada.EstadoTurno.EN_RUTA)
                .map(this::mapToDTO);
    }

    public List<TurnoResponseDTO> listarTurnosActivos() {
        return turnoRepository.findByEstadoOrderByFechaHoraInicioDesc(TurnoJornada.EstadoTurno.EN_RUTA)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TurnoResponseDTO> listarHistorialVehiculo(Long vehiculoId) {
        return turnoRepository.findByVehiculoIdOrderByFechaHoraInicioDesc(vehiculoId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TurnoResponseDTO> listarHistorialConductor(Long conductorId) {
        return turnoRepository.findByConductorIdOrderByFechaHoraInicioDesc(conductorId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TurnoResponseDTO> listarTurnosRecientes() {
        return turnoRepository.findTop50ByOrderByFechaHoraInicioDesc()
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private TurnoResponseDTO mapToDTO(TurnoJornada t) {
        TurnoResponseDTO dto = new TurnoResponseDTO();
        dto.setId(t.getId());
        if (t.getVehiculo() != null) {
            dto.setVehiculoId(t.getVehiculo().getId());
            dto.setVehiculoPatente(t.getVehiculo().getPatente());
            dto.setVehiculoMarca(t.getVehiculo().getMarca());
            dto.setVehiculoModelo(t.getVehiculo().getModelo());
        }
        if (t.getConductor() != null) {
            dto.setConductorId(t.getConductor().getId());
            dto.setConductorNombre(t.getConductor().getFullName() != null ? t.getConductor().getFullName() : t.getConductor().getUsername());
            dto.setConductorRut(t.getConductor().getRut());
        }
        if (t.getIniciadoPor() != null) {
            dto.setIniciadoPorId(t.getIniciadoPor().getId());
            dto.setIniciadoPorNombre(t.getIniciadoPor().getFullName() != null ? t.getIniciadoPor().getFullName() : t.getIniciadoPor().getUsername());
        }
        if (t.getCerradoPor() != null) {
            dto.setCerradoPorId(t.getCerradoPor().getId());
            dto.setCerradoPorNombre(t.getCerradoPor().getFullName() != null ? t.getCerradoPor().getFullName() : t.getCerradoPor().getUsername());
        }
        dto.setKmInicio(t.getKmInicio());
        dto.setKmFin(t.getKmFin());
        dto.setKmGpsRecorridos(t.getKmGpsRecorridos());
        dto.setFechaHoraInicio(t.getFechaHoraInicio());
        dto.setFechaHoraFin(t.getFechaHoraFin());
        dto.setEstado(t.getEstado().name());
        dto.setTipoSalida(t.getTipoSalida());
        dto.setEsCierreAdministrativo(t.getEsCierreAdministrativo());
        dto.setObservaciones(t.getObservaciones());
        dto.setLatitudInicio(t.getLatitudInicio());
        dto.setLongitudInicio(t.getLongitudInicio());
        dto.setLatitudFin(t.getLatitudFin());
        dto.setLongitudFin(t.getLongitudFin());
        return dto;
    }
}
