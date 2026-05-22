package com.bank.riskcontrol.entity;

import com.bank.riskcontrol.enums.TransactionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "Transaction_record")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false,unique = true)
    private String transactionNo;

    @Column(nullable = false)
    private String fromAccountNo;

    @Column(nullable = false)
    private String toAccountNo;

    @Column(nullable = false,precision = 19,scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    private String riskReason;//风险拦截原因，正常交易为null

    @Column(nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePresist(){
        this.createdAt = LocalDateTime.now();
    }
}
