package com.bank.riskcontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferRequest {
    @NotBlank(message = "付款账户不能为空")
    private String fromAccountNo;

    @NotBlank(message = "收款账户不能为空")
    private String toAccountNo;

    @NotBlank(message = "转账金额不能为空")
    @DecimalMin(value = "0.01", message = "转账金额要大于0")
    private BigDecimal amount;
}
