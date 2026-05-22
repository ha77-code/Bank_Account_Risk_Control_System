package com.bank.riskcontrol.repository;

import com.bank.riskcontrol.entity.TransactionRecord;
import com.bank.riskcontrol.enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<TransactionRecord,Long> {
    //查询某账户的交易流水
    List<TransactionRecord> findByFromAccountNoOrToAccountNoOrderByCreatedAtDesc(
            String fromAccountNo,String toAccountNo);
    //查询某账户最近N分钟内的付款次数（风控用）
    @Query("SELECT COUNT(t) FROM TransactionRecord t " +
            "WHERE t.fromAccountNo = :accountNo " +
            "AND t.createdAt >= :since " +
            "AND t.status = 'SUCCESS'")//衔接下一句的时候最后要加上空格
    long countRecentTransactions(
            @Param("accountNo") String accountNo,
            @Param("since") LocalDateTime since
    );
    //查询被风控拦截的交易
    List<TransactionRecord> findByStatusOrderByCreatedAtDesc(TransactionStatus status);
}
