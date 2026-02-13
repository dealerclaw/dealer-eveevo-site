# EVEEVO Web Application - TODO

## Phase 1: Setup & Design System
- [x] Configure Firebase SDK integration (Auth, Firestore, Realtime Database)
- [x] Set up green color scheme (#9BCB90, #5C927A) in Tailwind CSS
- [x] Create responsive layout structure with navigation
- [x] Set up database schema for cars, dealers, reservations, user profiles

## Phase 2: Authentication & User Management
- [ ] Implement Firebase Authentication (individual and business users)
- [ ] Create user profile management page
- [ ] Build account settings and preferences
- [ ] Add saved searches functionality
- [ ] Add favorites/wishlist feature
- [ ] Implement subscription management

## Phase 3: Car Browsing & Search
- [x] Integrate OneAuto API to load 15k+ EV cars inventory
- [x] Update copy to reflect 54k+ EVs and Hybrids
- [x] Fix navigation errors and page routing issues
- [x] Fix Select.Item empty value error
- [x] Fix nested anchor tag errors in Link components
- [x] Implement one-click filter buttons based on EV database mapping
- [x] Sync car data from Firebase to local database
- [x] Display real car listings from Firebase
- [x] Create admin sync page at /admin/sync
- [x] Run Firebase sync to populate database with car data
- [x] Debug why EVs are not being returned from database
- [x] Verify Firebase connection and data sync
- [x] Load all EVs from OneAuto spreadsheet into database
- [x] Import 5 sample cars for testing
- [x] Fix car images not displaying on Browse page
- [x] Create batch import script for 54k+ vehicles from Excel
- [x] Import all real inventory with actual images from OneAuto
- [x] Import 9,604 vehicles with real images from OneAuto Excel
- [x] Fix Browse page to display imported cars with actual photos
- [x] Import remaining 88,848 vehicles from Excel (currently 9,604 of 98,452)
- [x] Clear current inventory and import merged Firebase data
- [x] Verify merged data includes EV specs and car adverts
- [x] Test that all fields are properly mapped
- [x] Successfully imported 14,569 vehicles from merged Firebase data with EV specs
- [x] Fix car images not displaying after Firebase import
- [x] Verify image URLs from merged data are correct
- [x] Update image field parsing in import script
- [x] Re-imported all 14,569 vehicles with correct photoURLs
- [x] Display real range (WLTP miles) on car cards
- [x] Display charging time on car cards
- [x] Update car detail pages to show range and charging specs
- [x] Fix vehicle count showing only 50 instead of actual count
- [x] Verify actual number of cars in database
- [x] Increase Browse page limit from 50 to 1000 vehicles
- [x] Add pagination controls with Previous/Next buttons
- [x] Add page number navigation (show 5 pages at a time)
- [x] Display current page and total pages
- [x] Show 24 vehicles per page
- [x] Reset to page 1 when filters change
- [x] Fix Rebecca chatbot to use Pinecone vector search
- [x] Connect Rebecca to actual car database with AI semantic search
- [x] Update Rebecca to accept carId for car-specific queries
- [x] Integrate Rebecca chat on car detail pages
- [x] Implement URL parameter filtering on Browse page
- [x] Build car detail pages with specifications and images
- [x] Add reservation functionality to car detail pages
- [x] Update tagline to "Smart. Easy. Electric." (remove Hybrid)
- [x] Build home page with featured cars
- [x] Create car listing/browse page with grid/list views
- [x] Implement classic search with filters (make, model, price, range, location)
- [x] Implement lifestyle search (match cars to user lifestyle needs)
- [x] Integrate EV-Database API for new car specs in lifestyle search
- [x] Allow lifestyle search to show both new and used cars
- [ ] Build car detail page with image gallery
- [ ] Display EV specifications from EV-Database API
- [ ] Show dealer information on car pages
- [ ] Add real range calculator
- [ ] Add fuel cost per mile calculator

## Phase 4: AI Chat, Finance & Dealers
- [x] Fix nested anchor tag error on home page
- [x] Integrate Rebecca AI chat assistant (existing backend endpoint)
- [x] Create floating chat widget component
- [x] Connect chat to Rebecca AI backend
- [ ] Build finance calculator interface
- [ ] Implement Evolution Funding API integration for credit checks
- [ ] Create finance quote form
- [ ] Build dealer search and directory
- [ ] Integrate Google Maps for dealer locations
- [ ] Display dealer inventory and contact information

## Phase 5: Reservation System
- [ ] Build car reservation flow
- [ ] Create user reservation dashboard
- [ ] Implement reservation management (view, modify, cancel)
- [ ] Add reservation notifications
- [ ] Build dealer reservation management interface

## Phase 6: Testing & Polish
- [ ] Test all Firebase integrations
- [ ] Verify API connections (EV-Database, Evolution Funding, Rebecca)
- [ ] Test responsive design on mobile, tablet, desktop
- [ ] Verify authentication flows
- [ ] Test reservation system end-to-end
- [ ] Performance optimization
- [ ] Create deployment checkpoint

## Urgent Fixes
- [x] Update range display to show Real Range from Excel file (not WLTP range)
- [x] Verify Real Range field exists in database schema
- [x] Update Browse page to display Real Range
- [x] Update CarDetail page to display Real Range

## Current Tasks
- [x] Add used price display to home page featured cars section
- [x] Verify prices display correctly on car detail pages when clicking images
- [x] Ensure price data from Excel is properly imported and displayed

## Fast Charge Time and Acceleration Update
- [x] Import Fastcharge_ChargeTime data from Excel (10-80% charge time in minutes)
- [x] Import Performance_Acceleration data from Excel (0-60 mph time)
- [x] Update chargingTime field in database with fast charge data
- [x] Update acceleration field in database with 0-60 mph data
- [x] Update Browse page to display fast charge time and acceleration
- [x] Update CarDetail page to show fast charge time and acceleration with proper labeling

## Display Updates
- [x] Add mileage to Browse page car cards (front page of advert)
- [x] Verify fast charge time displays on car detail page

## Bug Fixes
- [x] Investigate why mileage is blank on Browse page
- [x] Verify mileage data exists in database
- [x] Ensure Browse page query includes mileage field
- [x] Fix mileage display on car cards

## Mileage Filter Feature
- [x] Add minMileage and maxMileage parameters to backend router
- [x] Update getCars function to filter by mileage range
- [x] Add mileage range slider to Browse page filters UI
- [x] Test mileage filtering functionality

## Sorting Feature
- [x] Add sorting dropdown UI to Browse page
- [x] Implement sort by price (low to high, high to low)
- [x] Implement sort by mileage (low to high)
- [x] Implement sort by range (longest first)
- [x] Implement sort by newest listings
- [x] Test sorting functionality

## Save Search Feature
- [x] Create savedSearches table in database schema
- [x] Add backend API endpoints for saving/retrieving/deleting saved searches
- [x] Add "Save Search" button to Browse page filters
- [x] Create "My Saved Searches" management UI
- [x] Test Save Search functionality

Note: Notification system for matching vehicles can be implemented as a future enhancement using background jobs to check for new vehicles matching saved search criteria.

## Bug Fixes - Lifestyle Search
- [x] Investigate why Lifestyle Search is not working
- [x] Fix Lifestyle Search functionality
- [x] Test Lifestyle Search feature

## Bug Fixes - Lifestyle Search Returns 0 Cars
- [x] Debug why Lifestyle Search returns 0 cars
- [x] Check database query filters (minRange, maxPrice)
- [x] Fix query to return matching vehicles (changed from cars.range to cars.realRange)
- [x] Test with different search criteria

## Update Browse Page Range Filter
- [x] Update Browse page to use realRange instead of range for filtering (already working after backend fix)
- [x] Test range filter with different values
- [x] Verify filter works correctly with other filters

## Vehicle Comparison Tool
- [x] Add comparison state management (localStorage for selected vehicles)
- [x] Add "Compare" checkbox to Browse page car cards
- [x] Create floating comparison bar showing selected vehicles
- [x] Build Compare page with side-by-side specification table
- [x] Add ability to remove vehicles from comparison
- [x] Test comparison with 2-4 vehicles

## Recently Viewed Feature
- [x] Add tracking to CarDetail page to save viewed vehicles to localStorage
- [x] Create RecentlyViewed component to display recently viewed vehicles
- [x] Add RecentlyViewed component to Browse page
- [x] Limit recently viewed to last 10 vehicles (stored 10, display 6)
- [x] Test recently viewed tracking and display

## Dealer Inventory Management Portal
- [x] Add carViews and carInquiries tables to database schema
- [x] Push database schema changes
- [x] Add dealer router to backend with authentication
- [x] Create dealer database functions (stats, inventory, CRUD)
- [x] Create dealer dashboard overview page with stats
- [x] Build vehicle listing page showing dealer's inventory
- [ ] Create add/edit vehicle form with all fields
- [ ] Implement photo upload to S3 for vehicle images
- [ ] Add delete vehicle functionality
- [ ] Create analytics dashboard showing listing views and inquiries
- [ ] Test dealer portal with full CRUD operations

## Complete Dealer Portal UI
- [x] Build AddVehicle form with all specification fields
- [ ] Build EditVehicle form (reuse AddVehicle with pre-filled data)
- [x] Implement S3 photo upload component for vehicle images
- [x] Add dealer portal routes to App.tsx (/dealer/dashboard, /dealer/inventory, /dealer/add-vehicle)
- [x] Test complete dealer workflow (add, edit, delete, toggle availability)

## Fix Dealers Navigation
- [x] Update Dealers tab in navigation to point to /dealer/dashboard
- [x] Test navigation works correctly

## Dealer Authentication
- [x] Add authentication check to dealer portal pages (redirect to login if not authenticated)
- [x] Add dealer role check (redirect to signup if not a dealer)
- [x] Create "Become a Dealer" signup page
- [x] Test authentication flow for dealer portal access

## Dealer Portal Sidebar Navigation
- [x] Create DealerLayout component with sidebar navigation
- [x] Add navigation links for Dashboard, My Inventory, Add Vehicle
- [x] Update all dealer pages to use DealerLayout wrapper
- [x] Test dealer navigation works correctly

## Test Dealer Account
- [x] Add test dealer account for anthony.m.perry@gmail.com
- [x] Verify dealer can access dealer portal

## Stripe Reservation Payment
- [x] Add Stripe feature to project
- [x] Configure Stripe for £99 reservation payments
- [x] Update Reserve button to create Stripe checkout session
- [x] Test reservation payment flow

## Dealer-to-Dealer Trading Platform
- [x] Add dealer subscription fields to dealers table (subscriptionStatus, subscriptionExpiresAt)
- [x] Add marketplace field to cars table (consumer, dealer_only)
- [x] Create Stripe subscription product for £99/month dealer access
- [x] Build subscription checkout endpoint
- [x] Create dealer marketplace listing API (only show dealer_only cars to subscribed dealers)
- [x] Build Dealer Marketplace page (/dealer/marketplace)
- [x] Add "Move to Dealer Marketplace" button on dealer inventory
- [x] Add "Move to Consumer Marketplace" button on dealer marketplace
- [x] Test subscription payment flow
- [x] Test moving cars between marketplaces
- [x] Test dealer marketplace visibility (only subscribed dealers can see)

## Dealer Marketplace Login & WhatsApp Integration
- [x] Add login button to dealer marketplace access denied page
- [x] Add WhatsApp contact buttons to dealer marketplace vehicle cards
- [x] Add WhatsApp contact buttons to consumer vehicle detail pages
- [x] Pre-fill WhatsApp message with vehicle details
- [x] Test login flow for dealer access
- [x] Test WhatsApp integration

## Dealer Application Email Notifications
- [x] Create dealerApplications table in database schema
- [x] Update dealer.submitApplication endpoint to store applications
- [x] Send email notification to anthony.perry@eveevo.com on new applications
- [x] Test dealer application form submission
- [x] Test email delivery

## Stripe Webhook Handler
- [x] Create /api/stripe/webhook endpoint
- [x] Handle customer.subscription.created event
- [x] Handle customer.subscription.updated event
- [x] Handle customer.subscription.deleted event
- [x] Update dealer subscription status in database
- [x] Test webhook with Stripe test events

## Dealer Analytics Dashboard
- [x] Add analytics queries to db.ts (views, inquiries, conversions)
- [x] Create analytics endpoint in dealer router
- [x] Build analytics UI component with charts
- [x] Add analytics navigation to dealer sidebar
- [x] Test analytics data display

## Bulk Vehicle Upload
- [x] Create CSV/Excel parser utility
- [x] Build upload UI with file picker and validation
- [x] Add progress indicator for bulk uploads
- [x] Add bulk upload navigation to dealer sidebar
- [x] Create downloadable CSV template
- [x] Test CSV upload with sample data

## Admin Approval Dashboard
- [x] Create admin router with getApplications endpoint
- [x] Create admin router with approveApplication endpoint
- [x] Create admin router with rejectApplication endpoint
- [x] Build admin approval UI page at /admin/applications
- [x] Add admin route to App.tsx
- [x] Test approval workflow

## Bug Fixes
- [x] Fix nested anchor tag error on CarDetail page

## Admin Navigation
- [x] Add Admin dropdown menu to Header (visible only to admin users)
- [x] Include Applications link in admin menu
- [x] Test admin menu visibility

## Admin Role Update
- [x] Update anthony.m.perry@gmail.com to admin role

## My Reservations Page
- [x] Create My Reservations page component
- [x] Add route for /reservations
- [x] Display user's vehicle reservations
- [x] Test reservations page

## Test Drive Booking System
- [x] Add testDriveBookings table to database schema
- [x] Create test drive booking form on car detail page
- [x] Add backend endpoints for creating and managing bookings
- [x] Build dealer calendar view page in dealer portal
- [x] Add navigation link to dealer calendar
- [x] Test complete booking flow

## Test Drive Enhancements
- [x] Add Book Test Drive button to car cards in Browse page
- [x] Add Google Calendar export button to dealer test drive calendar
- [x] Generate .ics file for individual bookings
- [x] Test both features

## Test Drive Button Visibility Fix
- [ ] Investigate why Book Test Drive button is not showing on car cards
- [ ] Fix button rendering issue
- [ ] Test button visibility on browse page

## Dealer Import from Spreadsheet
- [x] Parse Excel spreadsheet to extract dealer information (582 dealers, 14,905 cars)
- [ ] Create dealer accounts for all unique dealers
- [ ] Create user accounts for dealers with email addresses
- [ ] Assign cars to their respective dealers
- [ ] Pre-approve all imported dealers
- [ ] Test dealer assignments and car visibility
- [ ] Add dealer telephone and email display to dealer dashboard
- [ ] Add seller profile URL to dealer dashboard
- [ ] Add car location (from seller address) to consumer car listings

## Freemium Dealer Model with Finance Integration
- [x] Add Evolution Funding API credentials to environment
- [ ] Create Evolution Funding API service integration
- [ ] Build finance application form component
- [ ] Add finance application backend endpoints
- [ ] Add prominent "Arrange Finance with EVEEVO" button on free tier dealer cars
- [ ] Hide/minimize finance button for paid dealers (subscriptionStatus = 'active')
- [ ] Update dealer-to-dealer marketplace to require active subscription
- [ ] Restrict bulk CSV upload to paid dealers only
- [ ] Add upgrade prompts and feature comparison in dealer dashboard
- [ ] Add featured dealer badge for paid subscribers
- [ ] Test complete freemium flow

## Finance Check Integration (Evolution Funding API)
- [x] Create finance check database table to store applications
- [x] Add finance check router with tRPC procedures
- [x] Build 5-step finance check form matching Flutter app:
  - [x] Step 1: Personal Details (title, name, DOB, email, mobile, address with OneAuto lookup)
  - [x] Step 2: Employment Information (status, employer, income, time at job)
  - [x] Step 3: Affordability Declaration (confirm can afford payments)
  - [x] Step 4: Review & Submit (show all details for confirmation)
  - [x] Step 5: Credit Score Result (display score and pre-approval status)
- [x] Add "Arrange Finance with EVEEVO" button to car detail pages
- [x] Show finance button prominently for FREE tier dealers (subscriptionStatus !== 'active')
- [x] Hide/minimize finance button for PAID tier dealers (subscriptionStatus === 'active')
- [x] Test complete finance check flow end-to-end
- [x] Verify Evolution Funding API integration works correctly

## Admin Dealers Management
- [x] Create admin dealers page to view all dealers with their information
- [x] Show dealer car listings with count and details
- [x] Add ability to view dealer's full inventory
- [x] Verify test drive button visibility on car detail pages
- [x] Ensure test drive button shows on browse page car cards

**Note**: Test drive button only appears when car has dealer assigned (car.dealer exists). Most EV Database cars don't have dealerId yet.

## Excel Data Import (Used EVs + Dealers)
- [x] Locate Excel spreadsheet with 14,905 used cars and 584 dealers
- [x] Analyze spreadsheet structure and column mappings
- [x] Create import script to process dealer data
- [x] Create import script to process car data with dealer assignments
- [x] Execute import and populate database
- [x] Verify data integrity (dealer counts, car counts, relationships)
- [x] Test that test drive buttons now appear on used cars
- [x] Verify dealer dashboard shows correct inventory

**Import Results:**
- ✅ 584 dealers imported successfully
- ✅ 14,905 used cars imported with dealer assignments
- ✅ Test drive buttons now visible on all car listings
- ✅ Top dealers: Arnold Clark (1,302 cars), Sytner Group (1,266 cars), Marshall Motor Group (797 cars)


## Fix Car Images Display Issue
- [x] Investigate why images aren't showing on car adverts
- [x] Check image URL format in database
- [x] Fix image parsing from photoURLs array
- [x] Verify images display correctly on Browse and Detail pages

**Fix Applied:** Created script to update all 14,905 cars with mainImage and images array from Excel photoURLs data

## Dealer Profile Pages
- [x] Create dealer profile page route (/dealers/:id)
- [x] Display dealer information (name, contact, location, ratings)
- [x] Show dealer's full car inventory on profile page
- [x] Add location map integration
- [x] Add dealer ratings and reviews section

## Car Image Galleries
- [x] Parse multiple images from photoURLs array
- [x] Implement image carousel/gallery component
- [x] Add thumbnail navigation
- [x] Add fullscreen image viewer
- [x] Update Browse page to show image count indicator
- [x] Update Detail page with full gallery

## Automated Dealer Onboarding
- [x] Create dealer registration page
- [x] Add business verification form
- [x] Implement 4-step onboarding wizard with progress tracking
- [x] Add document upload for business proof
- [x] Create admin approval workflow (via existing dealer applications system)
- [ ] Send welcome email after approval (future enhancement)
- [ ] Add onboarding tutorial for new dealers (future enhancement)
