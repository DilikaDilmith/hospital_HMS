package com.hospital.hms.service;

import com.hospital.hms.entity.AuditLog;
import com.hospital.hms.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void setAuditLogRepository(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Records an audit log entry.
     * Propagation.REQUIRES_NEW ensures that audit entries persist even if outer business transactions fail.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog log(String username, String action, String result, String details) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUsername(username != null && !username.trim().isEmpty() ? username.trim() : "ANONYMOUS");
        auditLog.setAction(action != null ? action.trim().toUpperCase() : "UNKNOWN_ACTION");
        auditLog.setResult(result != null ? result.trim().toUpperCase() : "INFO");
        auditLog.setTimestamp(LocalDateTime.now());
        auditLog.setDetails(sanitizeDetails(details));

        return auditLogRepository.save(auditLog);
    }

    public AuditLog logAction(String username, String action, String result, String details) {
        return log(username, action, result, details);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    /**
     * Redacts any inadvertently included password, token, or secret strings
     * to strictly comply with SRS security requirements.
     */
    private String sanitizeDetails(String details) {
        if (details == null) {
            return "";
        }
        return details.replaceAll("(?i)(password|token|secret|jwt|bearer)=[^\\s,&]+", "$1=[REDACTED]");
    }
}
