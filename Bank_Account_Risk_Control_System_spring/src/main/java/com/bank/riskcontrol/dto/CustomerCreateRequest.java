package com.bank.riskcontrol.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class CustomerCreateRequest {
    @NotBlank(message = "姓名不能为空")
    private String name;

    @NotBlank(message = "身份证号不能为空")
    private String idCardNo;

    @NotBlank(message = "手机号不能为空")
    private String phone;
}
