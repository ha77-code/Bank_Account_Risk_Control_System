package com.bank.riskcontrol.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CustomerResponse {
    private Long id;
    private String name;
    private String idCardNo;
    private String phone;
    private LocalDateTime createdAt;
}
