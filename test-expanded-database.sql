-- Test query to verify all models are in database
SELECT make, model, COUNT(*) as fault_count
FROM evFaults
GROUP BY make, model
ORDER BY make, model;
