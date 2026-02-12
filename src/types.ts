export type NodeShape =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'rounded-rectangle'
  | 'circle'
  | 'triangle'
  | 'hexagon'
  | 'cylinder' // Database
  | 'cloud'
  | 'document'
  | 'folder'
  | 'actor' // User
  | 'component'
  | 'storage' // Barrel
  | 'queue'
  | 'pentagon'
  | 'octagon'
  | 'parallelogram'
  | 'step'
  | 'tape';

export interface ArchNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  description?: string;
  locked?: boolean;
  color?: string;
  animationOrder?: number;
  shape?: NodeShape;
  layer?: number;
  customIcon?: string | null;
  customIconSize?: number;
  borderStyle?: 'solid' | 'dotted' | 'dashed' | 'double' | 'none';
  borderWidth?: 'thin' | 'medium' | 'thick';
  borderColor?: string;
  // Shape/background opacity (0-100, 0 = invisible, 100 = fully visible)
  shapeOpacity?: number;
  // NEW: Position hint for standalone nodes
  positionHint?: 'left' | 'right' | 'top' | 'bottom' | 'center';
}

export interface Link {
  id: string;
  source: string | ArchNode;
  target: string | ArchNode;
  label?: string;
  style?: 'solid' | 'dotted' | 'dashed' | 'double';
  color?: string;
  thickness?: 'thin' | 'medium' | 'thick';
  arrowheadSize?: number; // Scale factor, default 1
  arrowheadColor?: string; // Specific color for the arrowhead
  bidirectional?: boolean;
  // Enhanced properties
  curvature?: number;        // 0-100 percentage
  offsetDistance?: number;   // Distance from center line in pixels
  arrowheadStyle?: 'default' | 'filled' | 'outlined' | 'none';
  lineStyle?: 'straight' | 'curved' | 'elbow' | 'orthogonal';
  startMarker?: boolean;
  endMarker?: boolean;
  strokeWidth?: number;      // 1-10 pixels
  dashPattern?: string;      // e.g., "5,5" or "10,5,2,5"
  angle?: number;           // Custom angle in degrees (0-360)
  // Advanced features
  animated?: boolean;        // Enable animated flow indicator
}

export interface Container {
  id: string;
  label: string;
  type: 'region' | 'availability-zone' | 'tier' | 'vpc' | 'subnet' | 'security-group' | 'group' | 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  childNodeIds: string[];
  description?: string;
  color?: string;
  borderStyle?: 'solid' | 'dotted' | 'dashed' | 'double' | 'none';
  borderWidth?: 'thin' | 'medium' | 'thick';
  borderColor?: string;
  // NEW: Nested container support
  parentContainerId?: string;    // ID of parent container (for nesting)
  childContainerIds?: string[];  // IDs of child containers
  // NEW: Layout orientation
  orientation?: 'horizontal' | 'vertical';  // Node arrangement within container
  // NEW: Container level (0 = root, 1 = nested, 2 = deeply nested)
  nestingLevel?: number;
}

export interface DiagramData {
  title: string;
  architectureType: string;
  nodes: ArchNode[];
  links: Link[];
  containers?: Container[];
}

export interface BlogPost {
  id: string;
  created_at: string;
  title: string;
  slug: string;
  content: string;
  feature_image_url: string;
  author_name: string;
  published_at: string | null;
  is_published: boolean;
  meta_description: string;
  meta_keywords: string;
}

export enum IconType {
  // --- Standard AWS ---
  AwsEc2 = 'aws-ec2',
  AwsS3 = 'aws-s3',
  AwsRds = 'aws-rds',
  AwsLambda = 'aws-lambda',
  AwsApiGateway = 'aws-api-gateway',
  AwsLoadBalancer = 'aws-load-balancer',
  AwsCloudfront = 'aws-cloudfront',
  AwsEcs = 'aws-ecs',

  // --- Extended AWS ---
  AwsDynamoDb = 'aws-dynamodb',
  AwsSns = 'aws-sns',
  AwsSqs = 'aws-sqs',
  AwsEventbridge = 'aws-eventbridge',
  AwsCloudwatch = 'aws-cloudwatch',

  // --- Standard Azure ---
  AzureVm = 'azure-vm',
  AzureBlobStorage = 'azure-blob-storage',
  AzureSqlDatabase = 'azure-sql-database',

  // --- Extended Azure ---
  AzureAppService = 'azure-app-service',
  AzureFunctionApp = 'azure-function-app',
  AzureServiceBus = 'azure-service-bus',

  // --- Standard GCP ---
  GcpComputeEngine = 'gcp-compute-engine',
  GcpCloudStorage = 'gcp-cloud-storage',
  GcpCloudSql = 'gcp-cloud-sql',

  // --- Extended GCP ---
  GcpBigquery = 'gcp-bigquery',
  GcpPubsub = 'gcp-pubsub',

  // --- Containers & Orchestration ---
  Kubernetes = 'kubernetes',
  Docker = 'docker',

  // --- Messaging & Integration ---
  Kafka = 'kafka',
  MessageQueue = 'message-queue',
  EventBus = 'event-bus',
  ServiceMesh = 'service-mesh',

  // --- Analytics & Monitoring ---
  Monitoring = 'monitoring',
  Logging = 'logging',

  // --- Blockchain / Web3 ---
  BlockchainNode = 'blockchain-node',
  SmartContract = 'smart-contract',
  Wallet = 'wallet',
  Oracle = 'oracle',
  Ipfs = 'ipfs',

  // --- Development & Web ---
  Javascript = 'javascript',
  Nginx = 'nginx',
  ReactJs = 'react-js',
  NodeJs = 'node-js',
  Python = 'python',
  GoLang = 'go-lang',
  NextJs = 'next-js',
  ExpressJs = 'express-js',
  Dotenv = 'dotenv',
  C = 'c',
  Cpp = 'cpp',
  Swift = 'swift',

  // --- AI Models ---
  ChatGpt = 'chat-gpt',
  Gemini = 'gemini',
  Anthropic = 'anthropic',
  Grok = 'grok',

  // --- AI / ML ---
  Llm = 'llm',
  VectorDatabase = 'vector-database',
  EmbeddingModel = 'embedding-model',
  PromptManager = 'prompt-manager',
  DocumentLoader = 'document-loader',
  KnowledgeBase = 'knowledge-base',
  Gpu = 'gpu',
  ModelRegistry = 'model-registry',
  TrainingData = 'training-data',
  InferenceApi = 'inference-api',
  DataPreprocessing = 'data-preprocessing',
  Neuron = 'neuron',
  LayerLabel = 'layer-label',

  // --- Conceptual ---
  Brain = 'brain',
  Planning = 'planning',
  Perception = 'perception',
  Action = 'action',
  Environment = 'environment',
  Memory = 'memory',
  Interaction = 'interaction',
  WorldKnowledge = 'world-knowledge',
  InputEncoder = 'input-encoder',
  Simulation = 'simulation',
  Embody = 'embody',
  GroupLabel = 'group-label',

  // --- Databases ---
  Database = 'database',
  Sql = 'sql',
  MySql = 'mysql',
  Postgresql = 'postgresql',
  MongoDb = 'mongodb',
  DataStore = 'data-store',

  // --- Security ---
  Firewall = 'firewall',
  AuthService = 'auth-service',
  SecretsManager = 'secrets-manager',

  // --- Generic & Vendor ---
  User = 'user',
  WebServer = 'web-server',
  Api = 'api',
  Mobile = 'mobile',
  WebApp = 'web-app',
  LoadBalancer = 'load-balancer',
  Cache = 'cache',
  Cloud = 'cloud',
  ManagementConsole = 'management-console',
  Microsoft = 'microsoft',
  Google = 'google',
  Playground = 'playground',
  FileCode = 'file-code',
  Message = 'message',
  Sparkles = 'sparkles',
  Edit = 'edit',
  Gear = 'gear',
  Generic = 'generic',

  // --- Custom User Content ---
  CustomImage = 'custom-image',
}

export type Page =
  | 'landing'
  | 'auth'
  | 'app'
  | 'contact'
  | 'about'
  | 'api'
  | 'apiKey'
  | 'privacy'
  | 'terms'
  | 'docs'
  | 'neuralNetwork'
  | 'careers'
  | 'research'
  | 'sdk'
  | 'codeDiagram'
  | 'playground'
  | 'admin';