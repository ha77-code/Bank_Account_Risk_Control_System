package com.bank.riskcontrol.entity;

import com.bank.riskcontrol.enums.RiskRuleCode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "risk_rule_hit")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskRuleHit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String transactionNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskRuleCode ruleCode;

    @Column(nullable = false)
    private String ruleName;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        this.createdAt = LocalDateTime.now();
    }
}
