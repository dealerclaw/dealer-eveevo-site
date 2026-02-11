SELECT 
  COUNT(*) as total_cars,
  COUNT(dealerId) as cars_with_dealer,
  COUNT(*) - COUNT(dealerId) as cars_without_dealer
FROM cars
LIMIT 5;
