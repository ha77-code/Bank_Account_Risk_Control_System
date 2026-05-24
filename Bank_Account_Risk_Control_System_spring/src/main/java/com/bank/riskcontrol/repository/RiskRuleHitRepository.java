package com.bank.riskcontrol.repository;

import com.bank.riskcontrol.entity.RiskRuleHit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskRuleHitRepository extends JpaRepository<RiskRuleHit, Long> {
    List<RiskRuleHit> findByTransactionNo(String transactionNo);
}
