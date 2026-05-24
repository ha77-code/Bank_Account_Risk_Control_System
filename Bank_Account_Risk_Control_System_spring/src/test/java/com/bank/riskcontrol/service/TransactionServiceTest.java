package com.bank.riskcontrol.service;

import com.bank.riskcontrol.dto.*;
import com.bank.riskcontrol.entity.BankAccount;
import com.bank.riskcontrol.enums.TransactionStatus;
import com.bank.riskcontrol.exception.BusinessException;
import com.bank.riskcontrol.repository.BankAccountRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class TransactionServiceTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    private String accountA;
    private String accountB;

    // 每个测试前先创建两个账户
    @BeforeEach
    void setup() throws BusinessException {
        CustomerCreateRequest customerReq = new CustomerCreateRequest();
        customerReq.setName("测试用户");
        customerReq.setIdCardNo("TEST" + System.currentTimeMillis());
        customerReq.setPhone("13800000000");
        CustomerResponse customer = customerService.createCustomer(customerReq);

        AccountCreateRequest accReq1 = new AccountCreateRequest();
        accReq1.setCustomerId(customer.getId());
        accReq1.setInitialBalance(new BigDecimal("10000"));
        accountA = accountService.createAccount(accReq1).getAccountNo();

        AccountCreateRequest accReq2 = new AccountCreateRequest();
        accReq2.setCustomerId(customer.getId());
        accReq2.setInitialBalance(new BigDecimal("10000"));
        accountB = accountService.createAccount(accReq2).getAccountNo();
    }

    @Test
    @DisplayName("正常转账成功")
    void transferSuccess() throws BusinessException {
        TransferRequest req = new TransferRequest();
        req.setFromAccountNo(accountA);
        req.setToAccountNo(accountB);
        req.setAmount(new BigDecimal("1000"));

        TransactionResponse result = transactionService.transfer(req);

        assertEquals(TransactionStatus.SUCCESS, result.getStatus());

        // 验证余额
        BankAccount from = bankAccountRepository.findByAccountNo(accountA).get();
        BankAccount to = bankAccountRepository.findByAccountNo(accountB).get();
        assertEquals(0, new BigDecimal("9000").compareTo(from.getBalance()));
        assertEquals(0, new BigDecimal("11000").compareTo(to.getBalance()));    }

    @Test
    @DisplayName("余额不足转账失败")
    void transferFailedInsufficientBalance() throws BusinessException {
        TransferRequest req = new TransferRequest();
        req.setFromAccountNo(accountA);
        req.setToAccountNo(accountB);
        req.setAmount(new BigDecimal("10001"));

        TransactionResponse result = transactionService.transfer(req);

        assertEquals(TransactionStatus.FAILED, result.getStatus());

        // 余额不变
        BankAccount from = bankAccountRepository.findByAccountNo(accountA).get();
        assertEquals(0,new BigDecimal("10000").compareTo(from.getBalance()));
    }

    @Test
    @DisplayName("冻结账户被风控拦截")
    void transferBlockedFrozenAccount() throws BusinessException {
        accountService.freezeAccount(accountA);

        TransferRequest req = new TransferRequest();
        req.setFromAccountNo(accountA);
        req.setToAccountNo(accountB);
        req.setAmount(new BigDecimal("1000"));

        TransactionResponse result = transactionService.transfer(req);

        assertEquals(TransactionStatus.RISK_BLOCKED, result.getStatus());
    }

    @Test
    @DisplayName("单笔超过50000被风控拦截")
    void transferBlockedAmountExceeded() throws BusinessException {
        TransferRequest req = new TransferRequest();
        req.setFromAccountNo(accountA);
        req.setToAccountNo(accountB);
        req.setAmount(new BigDecimal("60000"));

        TransactionResponse result = transactionService.transfer(req);

        assertEquals(TransactionStatus.RISK_BLOCKED, result.getStatus());
    }

    @Test
    @DisplayName("付款和收款账户相同抛出异常")
    void transferSameAccountThrows() {
        TransferRequest req = new TransferRequest();
        req.setFromAccountNo(accountA);
        req.setToAccountNo(accountA);
        req.setAmount(new BigDecimal("1000"));

        assertThrows(BusinessException.class,
                () -> transactionService.transfer(req));
    }

    @Test
    @DisplayName("转账后生成交易流水")
    void transferGeneratesRecord() throws BusinessException {
        TransferRequest req = new TransferRequest();
        req.setFromAccountNo(accountA);
        req.setToAccountNo(accountB);
        req.setAmount(new BigDecimal("500"));

        TransactionResponse result = transactionService.transfer(req);

        List<TransactionResponse> records =
                transactionService.getTransactions(accountA);

        assertFalse(records.isEmpty());
        assertEquals(result.getTransactionNo(),
                records.get(0).getTransactionNo());
    }
}
