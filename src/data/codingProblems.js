export const DIFFICULTY_LEVELS = [
  { id: "easy", label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { id: "medium", label: "Intermediate", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { id: "hard", label: "Advanced", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { id: "expert", label: "Production", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
]

export const PROBLEMS = {
easy: [
{
  id:"e1", title:"REST API Health Check", source:"Backend Dev",
  problem:"Build an Express.js health-check endpoint that returns server uptime, memory usage, and current timestamp.",
  language:"javascript",
  code:`const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    uptime: \`\${Math.floor(uptime / 3600)}h \${Math.floor((uptime % 3600) / 60)}m\`,
    memory: {
      heapUsed: \`\${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB\`,
      rss: \`\${(mem.rss / 1024 / 1024).toFixed(1)} MB\`,
    },
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.listen(3000, () => console.log('Server on :3000'));`,
  timeComplexity:"O(1)", spaceComplexity:"O(1)",
},
{
  id:"e2", title:"Environment Config Loader", source:"DevOps",
  problem:"Create a Python config loader that reads from .env files with defaults, type casting, and required field validation.",
  language:"python",
  code:`import os
from pathlib import Path

class Config:
    """Load config from .env with defaults and validation."""
    
    def __init__(self, env_file='.env'):
        self._load_env(env_file)
    
    def _load_env(self, path):
        if Path(path).exists():
            for line in open(path):
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())
    
    def get(self, key, default=None, cast=str, required=False):
        val = os.environ.get(key, default)
        if required and val is None:
            raise ValueError(f"Missing required config: {key}")
        return cast(val) if val is not None else None

# Usage
config = Config()
DB_HOST = config.get('DB_HOST', 'localhost')
DB_PORT = config.get('DB_PORT', '5432', cast=int)
SECRET = config.get('SECRET_KEY', required=True)
DEBUG = config.get('DEBUG', 'false', cast=lambda v: v.lower() == 'true')`,
  timeComplexity:"O(n)", spaceComplexity:"O(n)",
},
{
  id:"e3", title:"CSV Data Pipeline", source:"Data Engineering",
  problem:"Build a Python script that reads a CSV, cleans null values, normalizes columns, and exports to JSON.",
  language:"python",
  code:`import csv
import json
from datetime import datetime

def process_csv(input_path, output_path):
    """Clean CSV data and export as structured JSON."""
    records = []
    
    with open(input_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cleaned = {}
            for key, val in row.items():
                key = key.strip().lower().replace(' ', '_')
                val = val.strip() if val else None
                # Try numeric conversion
                if val and val.replace('.','',1).isdigit():
                    val = float(val) if '.' in val else int(val)
                cleaned[key] = val
            
            # Skip rows with no usable data
            if any(v is not None for v in cleaned.values()):
                cleaned['_processed_at'] = datetime.now().isoformat()
                records.append(cleaned)
    
    with open(output_path, 'w') as f:
        json.dump(records, f, indent=2, default=str)
    
    print(f"Processed {len(records)} records -> {output_path}")
    return records

process_csv('sales_data.csv', 'clean_output.json')`,
  timeComplexity:"O(n * m)", spaceComplexity:"O(n)",
},
{
  id:"e4", title:"JWT Auth Middleware", source:"Web Security",
  problem:"Create Express middleware that validates JWT tokens, extracts user info, and handles expired/invalid tokens gracefully.",
  language:"javascript",
  code:`const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = header.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Usage
app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});`,
  timeComplexity:"O(1)", spaceComplexity:"O(1)",
},
],
medium: [
{
  id:"m1", title:"Web Scraper with Rate Limiting", source:"Automation",
  problem:"Build a Python web scraper that fetches product prices from multiple URLs with retry logic, rate limiting, and structured output.",
  language:"python",
  code:`import asyncio
import aiohttp
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Product:
    url: str
    name: str
    price: float
    currency: str
    scraped_at: str

class Scraper:
    def __init__(self, rate_limit=2):
        self.semaphore = asyncio.Semaphore(rate_limit)
        self.results = []
    
    async def fetch(self, session, url, retries=3):
        for attempt in range(retries):
            async with self.semaphore:
                try:
                    async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        if resp.status == 200:
                            return await resp.text()
                        if resp.status == 429:
                            await asyncio.sleep(2 ** attempt)
                            continue
                except aiohttp.ClientError:
                    await asyncio.sleep(1)
        return None

    async def scrape_all(self, urls):
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch(session, url) for url in urls]
            pages = await asyncio.gather(*tasks)
            return [p for p in pages if p]

# Usage
scraper = Scraper(rate_limit=3)
asyncio.run(scraper.scrape_all(urls))`,
  timeComplexity:"O(n)", spaceComplexity:"O(n)",
},
{
  id:"m2", title:"Redis Cache Layer", source:"Backend Infrastructure",
  problem:"Implement a caching decorator that stores function results in Redis with TTL, cache invalidation, and fallback to direct execution.",
  language:"python",
  code:`import redis
import json
import functools
import hashlib

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def cached(ttl=300, prefix='cache'):
    """Decorator: cache function results in Redis."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            # Build unique cache key from function + args
            key_data = f"{fn.__name__}:{args}:{sorted(kwargs.items())}"
            cache_key = f"{prefix}:{hashlib.md5(key_data.encode()).hexdigest()}"
            
            # Try cache first
            cached_val = r.get(cache_key)
            if cached_val is not None:
                return json.loads(cached_val)
            
            # Execute and cache
            result = fn(*args, **kwargs)
            try:
                r.setex(cache_key, ttl, json.dumps(result, default=str))
            except (TypeError, redis.RedisError):
                pass  # Don't fail if caching fails
            return result
        
        wrapper.invalidate = lambda *a, **kw: r.delete(
            f"{prefix}:{hashlib.md5(f'{fn.__name__}:{a}:{sorted(kw.items())}'.encode()).hexdigest()}"
        )
        return wrapper
    return decorator

@cached(ttl=600)
def get_user_profile(user_id):
    # Expensive DB query here
    return db.query(f"SELECT * FROM users WHERE id = {user_id}")`,
  timeComplexity:"O(1)", spaceComplexity:"O(1)",
},
{
  id:"m3", title:"WebSocket Chat Server", source:"Real-time Systems",
  problem:"Build a WebSocket chat server with rooms, user presence, message history, and typing indicators.",
  language:"javascript",
  code:`const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();    // roomId -> Set<ws>
const users = new Map();    // ws -> { name, room }

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    
    switch (msg.type) {
      case 'join': {
        const { room, name } = msg;
        users.set(ws, { name, room });
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room).add(ws);
        broadcast(room, { type: 'system', text: name + ' joined' }, ws);
        ws.send(JSON.stringify({ type: 'joined', room, users: getRoomUsers(room) }));
        break;
      }
      case 'message': {
        const user = users.get(ws);
        if (user) broadcast(user.room, {
          type: 'message', from: user.name,
          text: msg.text, time: Date.now()
        });
        break;
      }
      case 'typing': {
        const u = users.get(ws);
        if (u) broadcast(u.room, { type: 'typing', from: u.name }, ws);
        break;
      }
    }
  });

  ws.on('close', () => {
    const user = users.get(ws);
    if (user) {
      rooms.get(user.room)?.delete(ws);
      broadcast(user.room, { type: 'system', text: user.name + ' left' });
      users.delete(ws);
    }
  });
});

function broadcast(room, data, exclude) {
  rooms.get(room)?.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN)
      client.send(JSON.stringify(data));
  });
}

function getRoomUsers(room) {
  return [...(rooms.get(room) || [])].map(ws => users.get(ws)?.name);
}`,
  timeComplexity:"O(n) broadcast", spaceComplexity:"O(n)",
},
{
  id:"m4", title:"Database Migration System", source:"Backend Dev",
  problem:"Create a lightweight SQL migration runner that tracks applied migrations, supports rollback, and runs in order.",
  language:"python",
  code:`import sqlite3
import os
import glob
from datetime import datetime

class Migrator:
    def __init__(self, db_path, migrations_dir='./migrations'):
        self.conn = sqlite3.connect(db_path)
        self.dir = migrations_dir
        self._init_table()
    
    def _init_table(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                id INTEGER PRIMARY KEY,
                name TEXT UNIQUE,
                applied_at TEXT
            )
        """)
        self.conn.commit()
    
    def _applied(self):
        rows = self.conn.execute("SELECT name FROM _migrations ORDER BY id").fetchall()
        return {r[0] for r in rows}
    
    def migrate(self):
        applied = self._applied()
        files = sorted(glob.glob(os.path.join(self.dir, '*.up.sql')))
        
        for f in files:
            name = os.path.basename(f)
            if name not in applied:
                sql = open(f).read()
                print(f"Applying: {name}")
                self.conn.executescript(sql)
                self.conn.execute(
                    "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
                    (name, datetime.now().isoformat())
                )
                self.conn.commit()
        print("All migrations applied.")
    
    def rollback(self, steps=1):
        applied = list(self._applied())[-steps:]
        for name in reversed(applied):
            down = name.replace('.up.sql', '.down.sql')
            path = os.path.join(self.dir, down)
            if os.path.exists(path):
                print(f"Rolling back: {name}")
                self.conn.executescript(open(path).read())
                self.conn.execute("DELETE FROM _migrations WHERE name = ?", (name,))
                self.conn.commit()

Migrator('app.db').migrate()`,
  timeComplexity:"O(n)", spaceComplexity:"O(1)",
},
],
hard: [
{
  id:"h1", title:"Solana Token Launchpad", source:"Web3 / Anchor",
  problem:"Write an Anchor smart contract for a token launchpad: users deposit SOL, receive tokens at a bonding curve price, with a treasury vault.",
  language:"rust",
  code:`use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};

declare_id!("LaunchXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod token_launch {
    use super::*;

    pub fn initialize(ctx: Context<Init>, price_lamports: u64) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        launch.authority = ctx.accounts.authority.key();
        launch.mint = ctx.accounts.mint.key();
        launch.price = price_lamports;
        launch.total_sold = 0;
        launch.bump = ctx.bumps.launch;
        Ok(())
    }

    pub fn buy_tokens(ctx: Context<Buy>, sol_amount: u64) -> Result<()> {
        let launch = &mut ctx.accounts.launch;
        
        // Bonding curve: price increases 1% per 1000 tokens sold
        let multiplier = 100 + (launch.total_sold / 1000);
        let effective_price = launch.price * multiplier / 100;
        let token_amount = (sol_amount * 1_000_000) / effective_price;
        
        // Transfer SOL to treasury
        anchor_lang::system_program::transfer(
            CpiContext::new(ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                }),
            sol_amount,
        )?;
        
        // Mint tokens to buyer
        let seeds = &[b"launch", launch.authority.as_ref(), &[launch.bump]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.buyer_ata.to_account_info(),
                    authority: launch.to_account_info(),
                }, &[seeds]),
            token_amount,
        )?;
        
        launch.total_sold += token_amount;
        Ok(())
    }
}`,
  timeComplexity:"O(1) per buy", spaceComplexity:"O(1)",
},
{
  id:"h2", title:"Distributed Task Queue", source:"System Architecture",
  problem:"Build a production task queue with priority scheduling, dead-letter handling, retries with exponential backoff, and worker health checks.",
  language:"python",
  code:`import asyncio
import time
import uuid
import heapq
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Any

class Status(Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    DEAD = "dead_letter"

@dataclass(order=True)
class Job:
    priority: int
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8], compare=False)
    fn: Callable = field(compare=False, repr=False)
    args: tuple = field(default=(), compare=False)
    retries: int = field(default=3, compare=False)
    attempts: int = field(default=0, compare=False)
    status: Status = field(default=Status.PENDING, compare=False)
    result: Any = field(default=None, compare=False)

class TaskQueue:
    def __init__(self, workers=4):
        self.heap = []
        self.dead_letter = []
        self.sem = asyncio.Semaphore(workers)
        self.completed = 0
    
    def enqueue(self, fn, args=(), priority=5, retries=3):
        job = Job(priority=priority, fn=fn, args=args, retries=retries)
        heapq.heappush(self.heap, job)
        return job.id
    
    async def _execute(self, job):
        async with self.sem:
            job.status = Status.RUNNING
            job.attempts += 1
            try:
                if asyncio.iscoroutinefunction(job.fn):
                    job.result = await job.fn(*job.args)
                else:
                    job.result = job.fn(*job.args)
                job.status = Status.DONE
                self.completed += 1
            except Exception as e:
                if job.attempts >= job.retries:
                    job.status = Status.DEAD
                    job.result = str(e)
                    self.dead_letter.append(job)
                else:
                    backoff = 2 ** job.attempts
                    await asyncio.sleep(backoff)
                    heapq.heappush(self.heap, job)
    
    async def process(self):
        tasks = []
        while self.heap:
            job = heapq.heappop(self.heap)
            tasks.append(self._execute(job))
        await asyncio.gather(*tasks)
        return self.completed`,
  timeComplexity:"O(n log n)", spaceComplexity:"O(n)",
},
{
  id:"h3", title:"OAuth2 Authorization Server", source:"Security",
  problem:"Implement an OAuth2 authorization code flow with PKCE, refresh tokens, scope validation, and token revocation.",
  language:"javascript",
  code:`const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SECRET = process.env.AUTH_SECRET;
const codes = new Map();     // auth code -> { clientId, userId, scope, codeChallenge }
const refreshTokens = new Set();

function authorize(req, res) {
  const { client_id, redirect_uri, scope, state,
          code_challenge, code_challenge_method } = req.query;
  
  // After user login consent...
  const code = crypto.randomBytes(32).toString('hex');
  codes.set(code, {
    clientId: client_id, userId: req.user.id,
    scope, codeChallenge: code_challenge,
    method: code_challenge_method, expiresAt: Date.now() + 600000,
  });
  
  res.redirect(redirect_uri + '?code=' + code + '&state=' + state);
}

function token(req, res) {
  const { code, code_verifier, grant_type, refresh_token } = req.body;
  
  if (grant_type === 'authorization_code') {
    const entry = codes.get(code);
    if (!entry || entry.expiresAt < Date.now())
      return res.status(400).json({ error: 'invalid_grant' });
    
    // Verify PKCE
    const hash = crypto.createHash('sha256').update(code_verifier).digest('base64url');
    if (hash !== entry.codeChallenge)
      return res.status(400).json({ error: 'invalid_pkce' });
    
    codes.delete(code);
    return issueTokens(res, entry.userId, entry.scope);
  }
  
  if (grant_type === 'refresh_token') {
    if (!refreshTokens.has(refresh_token))
      return res.status(400).json({ error: 'invalid_refresh' });
    const decoded = jwt.verify(refresh_token, SECRET);
    refreshTokens.delete(refresh_token);
    return issueTokens(res, decoded.sub, decoded.scope);
  }
}

function issueTokens(res, userId, scope) {
  const access = jwt.sign({ sub: userId, scope }, SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: userId, scope }, SECRET, { expiresIn: '7d' });
  refreshTokens.add(refresh);
  res.json({ access_token: access, refresh_token: refresh, token_type: 'Bearer' });
}`,
  timeComplexity:"O(1)", spaceComplexity:"O(n)",
},
],
expert: [
{
  id:"x1", title:"Solana AMM with Fees", source:"DeFi / Anchor",
  problem:"Implement a constant-product automated market maker on Solana with LP tokens, swap fees, and slippage protection.",
  language:"rust",
  code:`use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, MintTo, Burn};

declare_id!("AMMxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod nomad_amm {
    use super::*;

    pub fn add_liquidity(ctx: Context<AddLiq>, amount_a: u64, amount_b: u64) -> Result<()> {
        let pool = &ctx.accounts.pool;
        let reserve_a = ctx.accounts.vault_a.amount;
        let reserve_b = ctx.accounts.vault_b.amount;
        
        // Calculate LP tokens to mint
        let lp_supply = ctx.accounts.lp_mint.supply;
        let lp_amount = if lp_supply == 0 {
            (amount_a as f64 * amount_b as f64).sqrt() as u64
        } else {
            std::cmp::min(
                amount_a * lp_supply / reserve_a,
                amount_b * lp_supply / reserve_b,
            )
        };
        
        // Deposit both tokens
        token::transfer(ctx.accounts.deposit_a_ctx(), amount_a)?;
        token::transfer(ctx.accounts.deposit_b_ctx(), amount_b)?;
        
        // Mint LP tokens
        let seeds = &[b"pool", pool.seed.as_ref(), &[pool.bump]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.lp_mint.to_account_info(),
                    to: ctx.accounts.user_lp.to_account_info(),
                    authority: pool.to_account_info(),
                }, &[seeds]),
            lp_amount)?;
        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64, min_out: u64) -> Result<()> {
        let reserve_in = ctx.accounts.vault_in.amount;
        let reserve_out = ctx.accounts.vault_out.amount;
        
        let fee = amount_in * 30 / 10000;  // 0.3% fee
        let net = amount_in - fee;
        let out = (reserve_out as u128 * net as u128 / (reserve_in as u128 + net as u128)) as u64;
        
        require!(out >= min_out, AmmError::SlippageExceeded);
        
        token::transfer(ctx.accounts.user_deposit_ctx(), amount_in)?;
        let seeds = &[b"pool", ctx.accounts.pool.seed.as_ref(), &[ctx.accounts.pool.bump]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_out.to_account_info(),
                    to: ctx.accounts.user_receive.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                }, &[seeds]),
            out)?;
        Ok(())
    }
}

#[error_code]
pub enum AmmError {
    #[msg("Output below minimum — slippage exceeded")]
    SlippageExceeded,
}`,
  timeComplexity:"O(1) per op", spaceComplexity:"O(1)",
},
{
  id:"x2", title:"Real-time Event Pipeline", source:"Data Infrastructure",
  problem:"Build a production event ingestion pipeline with batching, backpressure, dead-letter queue, and exactly-once delivery guarantees.",
  language:"python",
  code:`import asyncio
import json
import time
import logging
from collections import deque
from dataclasses import dataclass, field

logger = logging.getLogger("pipeline")

@dataclass
class Event:
    id: str
    topic: str
    payload: dict
    timestamp: float = field(default_factory=time.time)
    attempts: int = 0

class EventPipeline:
    def __init__(self, batch_size=100, flush_interval=5, max_retries=3, max_queue=10000):
        self.buffer = []
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.max_retries = max_retries
        self.dead_letter = deque(maxlen=1000)
        self.processed_ids = set()  # exactly-once dedup
        self.max_queue = max_queue
        self._queue = asyncio.Queue(maxsize=max_queue)
        self.stats = {"ingested": 0, "processed": 0, "failed": 0}
    
    async def ingest(self, event: Event):
        if self._queue.qsize() >= self.max_queue:
            logger.warning("Backpressure: queue full, dropping event")
            return False
        await self._queue.put(event)
        self.stats["ingested"] += 1
        return True
    
    async def _flush(self, batch):
        """Send batch to sink (DB, Kafka, S3, etc.)."""
        deduped = [e for e in batch if e.id not in self.processed_ids]
        try:
            # Simulated sink write
            await asyncio.sleep(0.1)
            for e in deduped:
                self.processed_ids.add(e.id)
            self.stats["processed"] += len(deduped)
            logger.info(f"Flushed {len(deduped)} events")
        except Exception as ex:
            for e in deduped:
                e.attempts += 1
                if e.attempts >= self.max_retries:
                    self.dead_letter.append(e)
                    self.stats["failed"] += 1
                else:
                    await self._queue.put(e)
    
    async def run(self):
        while True:
            batch = []
            deadline = time.time() + self.flush_interval
            while len(batch) < self.batch_size and time.time() < deadline:
                try:
                    remaining = max(0.01, deadline - time.time())
                    event = await asyncio.wait_for(self._queue.get(), timeout=remaining)
                    batch.append(event)
                except asyncio.TimeoutError:
                    break
            if batch:
                await self._flush(batch)`,
  timeComplexity:"O(n) per batch", spaceComplexity:"O(batch + queue)",
},
],
}

export function getAllProblemsOrdered() {
  return [...PROBLEMS.easy, ...PROBLEMS.medium, ...PROBLEMS.hard, ...PROBLEMS.expert]
}

export function getDifficultyForIndex(index) {
  const e = PROBLEMS.easy.length, m = PROBLEMS.medium.length, h = PROBLEMS.hard.length
  if (index < e) return DIFFICULTY_LEVELS[0]
  if (index < e + m) return DIFFICULTY_LEVELS[1]
  if (index < e + m + h) return DIFFICULTY_LEVELS[2]
  return DIFFICULTY_LEVELS[3]
}
