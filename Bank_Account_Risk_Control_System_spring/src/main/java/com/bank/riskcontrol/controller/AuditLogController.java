package com.bank.riskcontrol.controller;

import com.bank.riskcontrol.common.ApiResponse;
import com.bank.riskcontrol.entity.AuditLog;
import com.bank.riskcontrol.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@Tag(name = "审计日志")
public class AuditLogController {
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "查询审计日志")
    public ApiResponse<List<AuditLog>> getAuditLogs(){
        return ApiResponse.success(
                auditLogRepository.findAllByOrderByCreatedAtDesc()
        );
    }
}
