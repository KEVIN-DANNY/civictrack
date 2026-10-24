require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Issue = require('./models/Issue');
const AuthorityStats = require('./models/AuthorityStats');
const { recalculateScore } = require('./utils/scoreCalculator');

const WARDS = [
  'Adyar', 'Anna Nagar', 'T Nagar', 'Mylapore', 'Velachery',
  'Kodambakkam', 'Tambaram', 'Perambur', 'Royapuram', 'Tondiarpet'
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civictrack';
    console.log(`[Seed] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected successfully.');

    // Clear existing collections
    await User.deleteMany({});
    await Issue.deleteMany({});
    await AuthorityStats.deleteMany({});
    console.log('[Seed] Cleared existing data.');

    // Password hashes
    const authSalt = await bcrypt.genSalt(10);
    const authorityHash = await bcrypt.hash('Authority@123', authSalt);
    const citizenHash = await bcrypt.hash('Citizen@123', authSalt);
    const adminHash = await bcrypt.hash('Admin@123', authSalt);

    // 1. Create Authority Accounts (3 wards: Adyar, Anna Nagar, T Nagar)
    const authorities = await User.insertMany([
      {
        name: 'Ramesh Sundaram (Ward Officer)',
        email: 'adyar.authority@civictrack.com',
        password: authorityHash,
        phone: '9840111222',
        ward: 'Adyar',
        role: 'authority',
        department: 'Roads & Infrastructure'
      },
      {
        name: 'Priya Narayanan (Ward Officer)',
        email: 'annanagar.authority@civictrack.com',
        password: authorityHash,
        phone: '9840333444',
        ward: 'Anna Nagar',
        role: 'authority',
        department: 'Water Supply & Sanitation'
      },
      {
        name: 'Karthik Subramanian (Ward Officer)',
        email: 'tnagar.authority@civictrack.com',
        password: authorityHash,
        phone: '9840555666',
        ward: 'T Nagar',
        role: 'authority',
        department: 'Drainage & Electrical Works'
      }
    ]);

    // 2. Create Citizen Accounts
    const citizens = await User.insertMany([
      {
        name: 'Ananya Krishnan',
        email: 'citizen1@civictrack.com',
        password: citizenHash,
        phone: '9840123456',
        ward: 'Adyar',
        role: 'citizen'
      },
      {
        name: 'Vijay Raghavan',
        email: 'citizen2@civictrack.com',
        password: citizenHash,
        phone: '9840654321',
        ward: 'Anna Nagar',
        role: 'citizen'
      }
    ]);

    // 3. Create Admin Account
    const admin = await User.create({
      name: 'Chief Municipal Admin',
      email: 'admin@civictrack.com',
      password: adminHash,
      phone: '9840999999',
      ward: 'Adyar',
      role: 'admin'
    });

    console.log(`[Seed] Inserted ${authorities.length} authorities, ${citizens.length} citizens, 1 admin.`);

    const authMap = {
      'Adyar': authorities[0],
      'Anna Nagar': authorities[1],
      'T Nagar': authorities[2]
    };

    // Helper for generating dates in the past
    const daysAgo = (d, h = 0) => new Date(Date.now() - (d * 24 + h) * 60 * 60 * 1000);

    // 4. Create 20 realistic issues spread across the 3 wards
    const sampleIssues = [
      // 1: Adyar - Resolved Roads
      {
        title: 'Deep pothole cluster near Gandhi Nagar 2nd Main Road',
        description: 'Large potholes extending across both lanes causing severe traffic bottlenecks and 2 bike skid accidents this week.',
        category: 'roads',
        status: 'resolved',
        escalationLevel: 0,
        ward: 'Adyar',
        location: { address: '14 Gandhi Nagar 2nd Main Road, Adyar, Chennai', lat: 13.0067, lng: 80.2570 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['Adyar']._id,
        upvoteCount: 14,
        upvotes: [citizens[0]._id, citizens[1]._id],
        createdAt: daysAgo(12, 4),
        acknowledgedAt: daysAgo(12, 1), // 3 hours after creation
        resolvedAt: daysAgo(10, 2),     // 46 hours to resolve
        comments: [
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'Almost damaged my car suspension here yesterday! Needs quick asphalt patch.', timestamp: daysAgo(11) },
          { user: authMap['Adyar']._id, userName: 'Ramesh Sundaram (Ward Officer)', text: 'Road repair team dispatched with cold bitumen mix.', timestamp: daysAgo(10, 6) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(12, 4), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['Adyar']._id, changedAt: daysAgo(12, 1), note: 'Inspected by assistant engineer' },
          { status: 'resolved', changedBy: authMap['Adyar']._id, changedAt: daysAgo(10, 2), note: 'Potholes fully filled and leveled.' }
        ]
      },
      // 2: Adyar - In Progress Water
      {
        title: 'Contaminated brown drinking water supply in Kasturba Nagar',
        description: 'Tap water has had high turbidity and foul chemical odor for three consecutive days. Residents cannot use it for cooking.',
        category: 'water',
        status: 'in_progress',
        escalationLevel: 0,
        ward: 'Adyar',
        location: { address: '3rd Cross Street, Kasturba Nagar, Adyar, Chennai', lat: 13.0031, lng: 80.2519 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['Adyar']._id,
        upvoteCount: 22,
        upvotes: [citizens[0]._id],
        createdAt: daysAgo(2, 6),
        acknowledgedAt: daysAgo(2, 2),
        resolvedAt: null,
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'Multiple apartment blocks affected along 3rd cross street.', timestamp: daysAgo(2) },
          { user: authMap['Adyar']._id, userName: 'Ramesh Sundaram (Ward Officer)', text: 'Water samples sent to laboratory. Pipeline flushing scheduled today.', timestamp: daysAgo(1) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(2, 6), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['Adyar']._id, changedAt: daysAgo(2, 2), note: 'MetroWater team notified' },
          { status: 'in_progress', changedBy: authMap['Adyar']._id, changedAt: daysAgo(1, 4), note: 'Flushing pipeline from pumping station' }
        ]
      },
      // 3: Adyar - Pending Sanitation
      {
        title: 'Uncleared garbage heap spilling onto pedestrian footpath',
        description: 'Overflowing municipal dustbins outside the local park have not been cleared for over 48 hours, creating health hazard.',
        category: 'sanitation',
        status: 'pending',
        escalationLevel: 0,
        ward: 'Adyar',
        location: { address: 'Near Besant Avenue Park, Adyar, Chennai', lat: 13.0012, lng: 80.2610 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['Adyar']._id,
        upvoteCount: 7,
        upvotes: [citizens[0]._id],
        createdAt: daysAgo(1, 2),
        acknowledgedAt: null,
        resolvedAt: null,
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'Stray dogs scattering trash across the entire sidewalk.', timestamp: daysAgo(1) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(1, 2), note: 'Issue reported' }
        ]
      },
      // 4: Adyar - Escalated Level 1 Drainage
      {
        title: 'Stagnant stormwater drain overflow on LB Road junction',
        description: 'Stormwater drain is blocked by construction silt, causing grey water stagnation across 50 meters of the road.',
        category: 'drainage',
        status: 'escalated',
        escalationLevel: 1,
        ward: 'Adyar',
        location: { address: 'Lattice Bridge Road Junction, Adyar, Chennai', lat: 13.0055, lng: 80.2562 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['Adyar']._id,
        upvoteCount: 19,
        upvotes: [citizens[0]._id, citizens[1]._id],
        createdAt: daysAgo(3, 8), // 80 hours ago
        acknowledgedAt: daysAgo(3, 2),
        resolvedAt: null,
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'Mosquito menace is unbearable now. Please clear the blockage.', timestamp: daysAgo(2) },
          { user: authMap['Adyar']._id, userName: 'Ramesh Sundaram (Ward Officer)', text: 'Desilting machinery requisitioned.', timestamp: daysAgo(1) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(3, 8), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['Adyar']._id, changedAt: daysAgo(3, 2), note: 'Drainage superintendent assigned' },
          { status: 'escalated', changedBy: null, changedAt: daysAgo(1, 8), note: 'Auto-escalated: 48hr breach' }
        ]
      },
      // 5: Adyar - Resolved Electricity
      {
        title: 'Flickering streetlights creating dark zone on Canal Bank Road',
        description: 'Five consecutive sodium vapor street lamps were dead or flickering, leaving cyclists and women unsafe at night.',
        category: 'electricity',
        status: 'resolved',
        escalationLevel: 0,
        ward: 'Adyar',
        location: { address: 'Canal Bank Road near bridge, Adyar, Chennai', lat: 13.0089, lng: 80.2520 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['Adyar']._id,
        upvoteCount: 11,
        upvotes: [citizens[0]._id],
        createdAt: daysAgo(9, 2),
        acknowledgedAt: daysAgo(9, 0), // within 2 hrs
        resolvedAt: daysAgo(8, 6),     // within 20 hrs
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'Very dark stretch, great risk of mugging.', timestamp: daysAgo(9) },
          { user: authMap['Adyar']._id, userName: 'Ramesh Sundaram (Ward Officer)', text: 'LED fixtures replaced and new junction box installed.', timestamp: daysAgo(8, 6) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(9, 2), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['Adyar']._id, changedAt: daysAgo(9, 0), note: 'Electrical contractor alerted' },
          { status: 'resolved', changedBy: authMap['Adyar']._id, changedAt: daysAgo(8, 6), note: 'All 5 bulbs replaced with LED luminaires' }
        ]
      },
      // 6: Adyar - Resolved Other
      {
        title: 'Hazardous fallen tree branch hanging over pedestrian pathway',
        description: 'Large banyan tree branch cracked in heavy rain, dangling dangerously above the school bus pickup point.',
        category: 'other',
        status: 'resolved',
        escalationLevel: 0,
        ward: 'Adyar',
        location: { address: 'Near St. Patrick School, Adyar, Chennai', lat: 13.0078, lng: 80.2490 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['Adyar']._id,
        upvoteCount: 15,
        upvotes: [citizens[0]._id],
        createdAt: daysAgo(16, 5),
        acknowledgedAt: daysAgo(16, 2),
        resolvedAt: daysAgo(15, 8),
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'School children walk right under this every morning.', timestamp: daysAgo(16) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(16, 5), note: 'Issue reported' },
          { status: 'resolved', changedBy: authMap['Adyar']._id, changedAt: daysAgo(15, 8), note: 'Parks department chopped branch safely' }
        ]
      },
      // 7: Adyar - Acknowledged Illegal Construction
      {
        title: 'Unauthorized commercial shed encroaching storm drain reserve',
        description: 'Permanent steel structure being erected on public reserve land blocking emergency rainwater canal access.',
        category: 'illegal_construction',
        status: 'acknowledged',
        escalationLevel: 0,
        ward: 'Adyar',
        location: { address: 'Opposite Cancer Institute, Canal Bank, Adyar, Chennai', lat: 13.0110, lng: 80.2450 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['Adyar']._id,
        upvoteCount: 31,
        upvotes: [citizens[0]._id, citizens[1]._id],
        createdAt: daysAgo(1, 10),
        acknowledgedAt: daysAgo(1, 2),
        resolvedAt: null,
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'They are pouring concrete foundations today!', timestamp: daysAgo(1) },
          { user: authMap['Adyar']._id, userName: 'Ramesh Sundaram (Ward Officer)', text: 'Stop-work notice issued to the party under MMC Act.', timestamp: daysAgo(0, 18) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(1, 10), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['Adyar']._id, changedAt: daysAgo(1, 2), note: 'Town planning enforcement officer dispatched' }
        ]
      },

      // --- Anna Nagar Issues (Authority 2: Priya Narayanan) ---
      // 8: Anna Nagar - Resolved Water
      {
        title: 'Burst water distribution pipeline flooding 2nd Avenue road',
        description: 'Potable water main ruptured creating a 2-foot fountain and wasting thousands of liters of treated drinking water.',
        category: 'water',
        status: 'resolved',
        escalationLevel: 0,
        ward: 'Anna Nagar',
        location: { address: '2nd Avenue, Roundtana Junction, Anna Nagar, Chennai', lat: 13.0850, lng: 80.2150 },
        reportedBy: citizens[1]._id,
        assignedTo: authMap['Anna Nagar']._id,
        upvoteCount: 28,
        upvotes: [citizens[0]._id, citizens[1]._id],
        createdAt: daysAgo(14, 2),
        acknowledgedAt: daysAgo(14, 0), // 1 hour
        resolvedAt: daysAgo(13, 10),    // 16 hours
        comments: [
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'Water pressure in surrounding buildings has dropped to zero.', timestamp: daysAgo(14) },
          { user: authMap['Anna Nagar']._id, userName: 'Priya Narayanan (Ward Officer)', text: 'Valve isolated, replacement pipe section welded.', timestamp: daysAgo(13, 10) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[1]._id, changedAt: daysAgo(14, 2), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['Anna Nagar']._id, changedAt: daysAgo(14, 0), note: 'Emergency team dispatched' },
          { status: 'resolved', changedBy: authMap['Anna Nagar']._id, changedAt: daysAgo(13, 10), note: 'Pipeline welded and supply restored' }
        ]
      },
      // 9: Anna Nagar - Resolved Sanitation
      {
        title: 'Commercial food waste dumped illegally on Shanthi Colony street',
        description: 'Restaurant waste bags dumped on empty plot rotting in the heat and attracting stray cattle and flies.',
        category: 'sanitation',
        status: 'resolved',
        escalationLevel: 0,
        ward: 'Anna Nagar',
        location: { address: '5th Main Road, Shanthi Colony, Anna Nagar, Chennai', lat: 13.0875, lng: 80.2120 },
        reportedBy: citizens[1]._id,
        assignedTo: authMap['Anna Nagar']._id,
        upvoteCount: 16,
        upvotes: [citizens[1]._id],
        createdAt: daysAgo(7, 3),
        acknowledgedAt: daysAgo(7, 1),
        resolvedAt: daysAgo(6, 4),
        comments: [
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'Notice should be served to the food outlets nearby.', timestamp: daysAgo(7) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[1]._id, changedAt: daysAgo(7, 3), note: 'Issue reported' },
          { status: 'resolved', changedBy: authMap['Anna Nagar']._id, changedAt: daysAgo(6, 4), note: 'Area cleared by compactor lorry; fine levied' }
        ]
      },
      // 10: Anna Nagar - Resolved Drainage
      {
        title: 'Clogged manhole overflowing during brief showers near Tower Park',
        description: 'Sewage water bubbling up from manhole lid outside Anna Nagar Tower park entrance, causing slippery road surface.',
        category: 'drainage',
        status: 'resolved',
        escalationLevel: 0,
        ward: 'Anna Nagar',
        location: { address: 'Tower Park Main Gate Road, Anna Nagar, Chennai', lat: 13.0888, lng: 80.2185 },
        reportedBy: citizens[1]._id,
        assignedTo: authMap['Anna Nagar']._id,
        upvoteCount: 20,
        upvotes: [citizens[0]._id, citizens[1]._id],
        createdAt: daysAgo(18, 4),
        acknowledgedAt: daysAgo(18, 1),
        resolvedAt: daysAgo(17, 6),
        comments: [
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'Needs super-sucker machine to clear heavy sludge.', timestamp: daysAgo(18) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[1]._id, changedAt: daysAgo(18, 4), note: 'Issue reported' },
          { status: 'resolved', changedBy: authMap['Anna Nagar']._id, changedAt: daysAgo(17, 6), note: 'Manhole de-silted with suction jet machine' }
        ]
      },
      // 11: Anna Nagar - In Progress Roads
      {
        title: 'Broken stormwater trench slab leaving dangerous open trench',
        description: 'Reinforced concrete slab over roadside drain caved in after heavy truck parked on it. Risk of pedestrian fall.',
        category: 'roads',
        status: 'in_progress',
        escalationLevel: 0,
        ward: 'Anna Nagar',
        location: { address: '12th Main Road, Anna Nagar West, Chennai', lat: 13.0895, lng: 80.2070 },
        reportedBy: citizens[1]._id,
        assignedTo: authMap['Anna Nagar']._id,
        upvoteCount: 13,
        upvotes: [citizens[1]._id],
        createdAt: daysAgo(2, 4),
        acknowledgedAt: daysAgo(2, 0),
        resolvedAt: null,
        comments: [
          { user: authMap['Anna Nagar']._id, userName: 'Priya Narayanan (Ward Officer)', text: 'Barricades placed. Precast RCC slab being delivered.', timestamp: daysAgo(1, 10) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[1]._id, changedAt: daysAgo(2, 4), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['Anna Nagar']._id, changedAt: daysAgo(2, 0), note: 'Barricaded by road safety crew' },
          { status: 'in_progress', changedBy: authMap['Anna Nagar']._id, changedAt: daysAgo(1, 10), note: 'RCC slab replacement underway' }
        ]
      },
      // 12: Anna Nagar - Pending Electricity
      {
        title: 'Hanging high-voltage wire touching tree branches in residential lane',
        description: 'Insulated 440V overhead cable sagging within 8 feet from ground level, sparks visible during high wind gusts.',
        category: 'electricity',
        status: 'pending',
        escalationLevel: 0,
        ward: 'Anna Nagar',
        location: { address: 'AF Block, 7th Street, Anna Nagar, Chennai', lat: 13.0840, lng: 80.2105 },
        reportedBy: citizens[1]._id,
        assignedTo: authMap['Anna Nagar']._id,
        upvoteCount: 25,
        upvotes: [citizens[0]._id, citizens[1]._id],
        createdAt: daysAgo(0, 14), // 14 hours ago
        acknowledgedAt: null,
        resolvedAt: null,
        comments: [
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'Extremely critical! TNEB must disconnect power and tighten cable.', timestamp: daysAgo(0, 10) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[1]._id, changedAt: daysAgo(0, 14), note: 'Issue reported' }
        ]
      },
      // 13: Anna Nagar - Escalated Level 1 Illegal Construction
      {
        title: 'Illegal rooftop cell tower installation on weakened structure',
        description: 'Heavy telecom tower being erected without structural stability certificate or municipal corporation NOC.',
        category: 'illegal_construction',
        status: 'escalated',
        escalationLevel: 1,
        ward: 'Anna Nagar',
        location: { address: 'Plot 44, C-Sector, Anna Nagar West Extension, Chennai', lat: 13.0910, lng: 80.2030 },
        reportedBy: citizens[1]._id,
        assignedTo: authMap['Anna Nagar']._id,
        upvoteCount: 18,
        upvotes: [citizens[1]._id],
        createdAt: daysAgo(4, 2), // 98 hours ago
        acknowledgedAt: daysAgo(3, 10),
        resolvedAt: null,
        comments: [
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'No corporation clearance displayed on construction site board.', timestamp: daysAgo(3) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[1]._id, changedAt: daysAgo(4, 2), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['Anna Nagar']._id, changedAt: daysAgo(3, 10), note: 'Notice issued' },
          { status: 'escalated', changedBy: null, changedAt: daysAgo(2, 2), note: 'Auto-escalated: 48hr breach' }
        ]
      },
      // 14: Anna Nagar - Resolved Other
      {
        title: 'Broken swing and rusted play equipment in children public park',
        description: 'Children playground swings have rusted chains with exposed metal burrs causing injury risks to toddlers.',
        category: 'other',
        status: 'resolved',
        escalationLevel: 0,
        ward: 'Anna Nagar',
        location: { address: 'K Block Park, Anna Nagar East, Chennai', lat: 13.0862, lng: 80.2220 },
        reportedBy: citizens[1]._id,
        assignedTo: authMap['Anna Nagar']._id,
        upvoteCount: 9,
        upvotes: [citizens[1]._id],
        createdAt: daysAgo(22, 6),
        acknowledgedAt: daysAgo(22, 1),
        resolvedAt: daysAgo(20, 4),
        comments: [
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'New swing set installed, thank you ward officer!', timestamp: daysAgo(20) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[1]._id, changedAt: daysAgo(22, 6), note: 'Issue reported' },
          { status: 'resolved', changedBy: authMap['Anna Nagar']._id, changedAt: daysAgo(20, 4), note: 'Park equipment replaced' }
        ]
      },

      // --- T Nagar Issues (Authority 3: Karthik Subramanian) ---
      // 15: T Nagar - Escalated Level 2 Drainage (Critical Breach)
      {
        title: 'Severe underground sewage backflow into Usman Road shops',
        description: 'Commercial shopping complex basements inundated with raw black sewage. Foul smell and inventory destruction over past 5 days.',
        category: 'drainage',
        status: 'escalated',
        escalationLevel: 2,
        ward: 'T Nagar',
        location: { address: 'Usman Road Flyover Junction, T Nagar, Chennai', lat: 13.0410, lng: 80.2330 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['T Nagar']._id,
        upvoteCount: 42,
        upvotes: [citizens[0]._id, citizens[1]._id],
        createdAt: daysAgo(5, 6), // 126 hours ago!
        acknowledgedAt: daysAgo(4, 2),
        resolvedAt: null,
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'Customers cannot enter retail stores. Critical livelihood loss!', timestamp: daysAgo(4) },
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'Unacceptable that 5 days have passed with zero on-ground resolution.', timestamp: daysAgo(2) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(5, 6), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['T Nagar']._id, changedAt: daysAgo(4, 2), note: 'Area sanitary officer inspected' },
          { status: 'escalated', changedBy: null, changedAt: daysAgo(3, 6), note: 'Auto-escalated: 48hr breach' },
          { status: 'escalated', changedBy: null, changedAt: daysAgo(1, 6), note: 'Auto-escalated: 96hr critical breach' }
        ]
      },
      // 16: T Nagar - Escalated Level 1 Roads
      {
        title: 'Huge crater and exposed steel rebars on Ranganathan Street',
        description: 'Trench dug by telecom contractor abandoned without backfilling. Thousands of daily shoppers dodging metal rods.',
        category: 'roads',
        status: 'escalated',
        escalationLevel: 1,
        ward: 'T Nagar',
        location: { address: 'Ranganathan Street Entrance, T Nagar, Chennai', lat: 13.0401, lng: 80.2305 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['T Nagar']._id,
        upvoteCount: 37,
        upvotes: [citizens[0]._id, citizens[1]._id],
        createdAt: daysAgo(3, 14), // 86 hours ago
        acknowledgedAt: daysAgo(3, 6),
        resolvedAt: null,
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'Elderly lady tripped and injured her knee yesterday.', timestamp: daysAgo(2) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(3, 14), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['T Nagar']._id, changedAt: daysAgo(3, 6), note: 'Notice issued to telecom contractor' },
          { status: 'escalated', changedBy: null, changedAt: daysAgo(1, 14), note: 'Auto-escalated: 48hr breach' }
        ]
      },
      // 17: T Nagar - In Progress Electricity
      {
        title: 'Open electrical junction box with live terminals near bus stop',
        description: 'Pillar box lid broken off at pedestrian eye level near Pondy Bazaar bus stand during festival rush.',
        category: 'electricity',
        status: 'in_progress',
        escalationLevel: 0,
        ward: 'T Nagar',
        location: { address: 'Pondy Bazaar Pedestrian Plaza, T Nagar, Chennai', lat: 13.0425, lng: 80.2370 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['T Nagar']._id,
        upvoteCount: 29,
        upvotes: [citizens[0]._id],
        createdAt: daysAgo(1, 6),
        acknowledgedAt: daysAgo(1, 1),
        resolvedAt: null,
        comments: [
          { user: authMap['T Nagar']._id, userName: 'Karthik Subramanian (Ward Officer)', text: 'Temporary fiber panel fixed. Permanent lock box ordered.', timestamp: daysAgo(0, 16) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(1, 6), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['T Nagar']._id, changedAt: daysAgo(1, 1), note: 'TNEB linemen reached site' },
          { status: 'in_progress', changedBy: authMap['T Nagar']._id, changedAt: daysAgo(0, 16), note: 'Enclosure box replacement underway' }
        ]
      },
      // 18: T Nagar - Pending Sanitation
      {
        title: 'Open burning of municipal dry leaves and plastic waste',
        description: 'Sanitation workers setting fire to leaf piles producing thick toxic smog that suffocates residential apartment residents.',
        category: 'sanitation',
        status: 'pending',
        escalationLevel: 0,
        ward: 'T Nagar',
        location: { address: 'Venkatnarayana Road, T Nagar, Chennai', lat: 13.0380, lng: 80.2365 },
        reportedBy: citizens[1]._id,
        assignedTo: authMap['T Nagar']._id,
        upvoteCount: 17,
        upvotes: [citizens[1]._id],
        createdAt: daysAgo(0, 8),
        acknowledgedAt: null,
        resolvedAt: null,
        comments: [
          { user: citizens[1]._id, userName: 'Vijay Raghavan', text: 'Air quality index spiked severely. Action must be taken.', timestamp: daysAgo(0, 4) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[1]._id, changedAt: daysAgo(0, 8), note: 'Issue reported' }
        ]
      },
      // 19: T Nagar - Resolved Water
      {
        title: 'Low water pressure on GN Chetty Road pipeline feeder',
        description: 'Multi-story residential apartments unable to pump water to overhead tanks due to mainline air-lock blockage.',
        category: 'water',
        status: 'resolved',
        escalationLevel: 0,
        ward: 'T Nagar',
        location: { address: 'GN Chetty Road, T Nagar, Chennai', lat: 13.0450, lng: 80.2400 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['T Nagar']._id,
        upvoteCount: 12,
        upvotes: [citizens[0]._id],
        createdAt: daysAgo(11, 4),
        acknowledgedAt: daysAgo(11, 2),
        resolvedAt: daysAgo(9, 6),
        comments: [
          { user: citizens[0]._id, userName: 'Ananya Krishnan', text: 'Air release valve cleared, pressure restored to normal.', timestamp: daysAgo(9) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(11, 4), note: 'Issue reported' },
          { status: 'resolved', changedBy: authMap['T Nagar']._id, changedAt: daysAgo(9, 6), note: 'De-aired mainline valve' }
        ]
      },
      // 20: T Nagar - Acknowledged Other
      {
        title: 'Stray cattle creating traffic hazards on North Usman Road',
        description: 'Unattended cows resting on the median and wandering into moving bus traffic causing severe delays.',
        category: 'other',
        status: 'acknowledged',
        escalationLevel: 0,
        ward: 'T Nagar',
        location: { address: 'North Usman Road, T Nagar, Chennai', lat: 13.0440, lng: 80.2315 },
        reportedBy: citizens[0]._id,
        assignedTo: authMap['T Nagar']._id,
        upvoteCount: 8,
        upvotes: [citizens[0]._id],
        createdAt: daysAgo(1, 4),
        acknowledgedAt: daysAgo(0, 20),
        resolvedAt: null,
        comments: [
          { user: authMap['T Nagar']._id, userName: 'Karthik Subramanian (Ward Officer)', text: 'Cattle impounding vehicle scheduled for morning patrol.', timestamp: daysAgo(0, 18) }
        ],
        statusHistory: [
          { status: 'pending', changedBy: citizens[0]._id, changedAt: daysAgo(1, 4), note: 'Issue reported' },
          { status: 'acknowledged', changedBy: authMap['T Nagar']._id, changedAt: daysAgo(0, 20), note: 'Veterinary and cattle enforcement alerted' }
        ]
      }
    ];

    const insertedIssues = await Issue.insertMany(sampleIssues);
    console.log(`[Seed] Successfully inserted ${insertedIssues.length} realistic civic issues.`);

    // 5. Calculate and populate AuthorityStats for all 3 authorities
    console.log('[Seed] Calculating accountability scores for authorities...');
    for (const auth of authorities) {
      const score = await recalculateScore(auth._id);
      const statDoc = await AuthorityStats.findOne({ authorityId: auth._id });
      console.log(`[Seed] Authority: ${auth.name} (${auth.ward}) -> Score: ${score}/100, Assigned: ${statDoc.totalAssigned}, Resolved: ${statDoc.totalResolved}, Escalated: ${statDoc.totalEscalated}`);
    }

    const totalUsers = await User.countDocuments();
    const totalIssues = await Issue.countDocuments();
    const totalStats = await AuthorityStats.countDocuments();

    console.log(`\n================ SEED COMPLETE ================`);
    console.log(`Total Users Inserted:          ${totalUsers}`);
    console.log(`Total Issues Inserted:         ${totalIssues}`);
    console.log(`Total AuthorityStats Inserted: ${totalStats}`);
    console.log(`===============================================\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
