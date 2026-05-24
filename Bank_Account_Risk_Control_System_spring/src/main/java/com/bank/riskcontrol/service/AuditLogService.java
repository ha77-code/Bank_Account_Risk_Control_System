package com.bank.riskcontrol.service;

import com.bank.riskcontrol.entity.AuditLog;
import com.bank.riskcontrol.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String operationType, String targetType,
                    String targetId, String description) {
        auditLogRepository.save(AuditLog.builder()
                .operationType(operationType)
                .targetType(targetType)
                .targetId(targetId)
                .description(description)
                .build());
    }
}
