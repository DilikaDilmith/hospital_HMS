package com.hospital.hms.repository;

import com.hospital.hms.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Retrieve all audit logs in reverse chronological order
    List<AuditLog> findAllByOrderByTimestampDesc();

    // Find audit logs by username
    List<AuditLog> findByUsernameOrderByTimestampDesc(String username);

    // Find audit logs by action
    List<AuditLog> findByActionOrderByTimestampDesc(String action);

    // Find audit logs by result (SUCCESS / FAILED)
    List<AuditLog> findByResultOrderByTimestampDesc(String result);
}
