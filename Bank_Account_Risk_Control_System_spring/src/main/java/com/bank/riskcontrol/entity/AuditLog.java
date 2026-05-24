package com.bank.riskcontrol.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_log")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String operationType;  // 如 TRANSFER、FREEZE、UNFREEZE

    @Column(nullable = false)
    private String targetType;     // 如 ACCOUNT、TRANSACTION

    @Column(nullable = false)
    private String targetId;       // 账户号或交易号

    @Column(nullable = false)
    private String description;    // 人读描述

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
