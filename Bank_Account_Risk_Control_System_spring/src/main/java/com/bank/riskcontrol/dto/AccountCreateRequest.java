package com.bank.riskcontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountCreateRequest {
    @NotNull(message = "客户ID不能为空")
    private Long customerId;

    @NotNull(message = "初始余额不能为空")
    @DecimalMin(value = "0.00", message = "初始余额不能为负数")
    private BigDecimal initialBalance;
}
