package com.bank.riskcontrol.dto;

import com.bank.riskcontrol.enums.TransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionResponse {
    private Long id;
    private String transactionNo;
    private String fromAccountNo;
    private String toAccountNo;
    private BigDecimal amount;
    private TransactionStatus status;
    private String riskReason;
    private LocalDateTime createdAt;
}
