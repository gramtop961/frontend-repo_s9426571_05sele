import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

async function jfetch(input, init) {
  try {
    const res = await fetch(input, init)
    const ct = res.headers.get('content-type') || ''
    if (!res.ok) {
      const msg = ct.includes('application/json') ? (await res.json()).detail || res.statusText : res.statusText
      return { ok: false, data: null, error: msg }
    }
    const data = ct.includes('application/json') ? await res.json() : null
    return { ok: true, data }
  } catch (e) {
    return { ok: false, data: null, error: e.message }
  }
}

function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth')
    return saved ? JSON.parse(saved) : null
  })

  const login = (payload) => {
    localStorage.setItem('auth', JSON.stringify(payload))
    setUser(payload)
  }
  const logout = () => {
    localStorage.removeItem('auth')
    setUser(null)
  }
  const token = user?.token
  const isAdmin = user?.role === 'admin'
  return { user, token, isAdmin, login, logout }
}

function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="group inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-indigo-600 text-white grid place-items-center font-bold shadow-sm">RS</div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-indigo-700 group-hover:text-indigo-800 transition">RS GAME GHOR</div>
              <div className="text-[11px] -mt-0.5 text-gray-500">Nagad • Instant Digital Store</div>
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="text-gray-700 hover:text-indigo-700">All Games</Link>
            {isAdmin && <Link to="/admin" className="text-gray-700 hover:text-indigo-700">Admin</Link>}
            {user ? (
              <button onClick={logout} className="px-3 py-1.5 rounded bg-gray-900/5 hover:bg-gray-900/10 text-gray-800">Logout</button>
            ) : (
              <Link to="/auth" className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t text-center text-sm text-gray-600 py-6">
        © {new Date().getFullYear()} RS GAME GHOR — Pay via Nagad Send Money
      </footer>
    </div>
  )
}

function FeaturedRow({ items }) {
  if (!items?.length) return null
  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Featured</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map(g => (
          <Link to={`/game/${g.id}`} key={g.id} className="min-w-[240px] bg-white rounded-lg shadow hover:shadow-md transition p-3">
            <div className="aspect-video bg-gray-100 rounded overflow-hidden">
              {g.images?.[0] ? (
                <img src={g.images[0]} alt={g.title} className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full grid place-items-center text-gray-400">No Image</div>
              )}
            </div>
            <div className="mt-2 font-medium line-clamp-1">{g.title}</div>
            <div className="text-sm text-gray-500">৳ {g.price}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function GamesList() {
  const [games, setGames] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [platform, setPlatform] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const url = new URL(API_BASE + '/games')
      if (q) url.searchParams.set('q', q)
      if (platform) url.searchParams.set('platform', platform)
      const [all, feat] = await Promise.all([
        jfetch(url.toString()),
        jfetch(`${API_BASE}/games?featured=true`)
      ])
      setGames(all.ok && Array.isArray(all.data) ? all.data : [])
      setFeatured(feat.ok && Array.isArray(feat.data) ? feat.data : [])
      if (!all.ok) setError(all.error || 'Failed to load games')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <div className="flex gap-2 items-center">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search games" className="px-3 py-2 border rounded w-64"/>
          <select value={platform} onChange={e=>setPlatform(e.target.value)} className="px-3 py-2 border rounded">
            <option value="">All Platforms</option>
            <option value="pc">PC</option>
            <option value="mobile">Mobile</option>
          </select>
          <button onClick={load} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Filter</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {error}. Please check your internet or try again.
        </div>
      )}

      <FeaturedRow items={featured} />

      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map(g => (
            <Link to={`/game/${g.id}`} key={g.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-3 flex flex-col">
              <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                {g.images?.[0] ? (
                  <img src={g.images[0]} alt={g.title} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full grid place-items-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="mt-3">
                <div className="font-semibold text-gray-800 line-clamp-1">{g.title}</div>
                <div className="text-sm text-gray-500">{g.platform?.toUpperCase()} • {g.category || 'General'}</div>
                <div className="mt-2 font-bold text-indigo-600">৳ {g.price}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Reviews({ gameId }) {
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [author, setAuthor] = useState('')

  const load = async () => {
    const r = await jfetch(`${API_BASE}/games/${gameId}/reviews`)
    setReviews(r.ok && Array.isArray(r.data) ? r.data : [])
  }
  useEffect(() => { load() }, [gameId])

  const submit = async (e) => {
    e.preventDefault()
    await jfetch(`${API_BASE}/games/${gameId}/reviews`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ rating: Number(rating), comment, author }) })
    setComment(''); setAuthor('')
    load()
  }

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Reviews</h3>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
        <input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Name (optional)" className="px-3 py-2 border rounded"/>
        <select value={rating} onChange={e=>setRating(e.target.value)} className="px-3 py-2 border rounded">
          {[1,2,3,4,5].map(n=> <option key={n} value={n}>{n} Star</option>)}
        </select>
        <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Write a review" className="px-3 py-2 border rounded sm:col-span-2"/>
        <button className="px-3 py-2 bg-gray-900 text-white rounded">Submit</button>
      </form>
      <div className="space-y-2">
        {reviews.map(r => (
          <div key={r.id} className="bg-white border rounded p-3">
            <div className="text-sm text-gray-600">{r.author || 'Anonymous'} • {r.rating}★</div>
            <div>{r.comment}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GameDetails() {
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [nagadNumber, setNagadNumber] = useState('')
  const [trx, setTrx] = useState('')
  const [note, setNote] = useState('')
  const [coupon, setCoupon] = useState('')
  const [couponInfo, setCouponInfo] = useState(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const r = await jfetch(`${API_BASE}/games/${id}`)
      setGame(r.ok ? r.data : null)
      setLoading(false)
    }
    run()
  }, [id])

  const checkCoupon = async () => {
    if (!coupon) return
    const r = await jfetch(`${API_BASE}/coupons/validate`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code: coupon, game_id: id }) })
    setCouponInfo(r.ok ? r.data : { valid: false, reason: r.error || 'Could not validate' })
  }

  const verifyTrx = async () => {
    if (!trx) return
    const r = await jfetch(`${API_BASE}/verify/nagad`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nagad_number: nagadNumber, transaction_id: trx, amount: game?.price }) })
    alert(r.ok && r.data?.verified ? 'TRX looks valid.' : `Not verified: ${r.error || r.data?.reason || ''}`)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    const r = await jfetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: id, buyer_email: buyerEmail, nagad_number: nagadNumber, transaction_id: trx, note, coupon_code: coupon || undefined })
    })
    if (!r.ok) {
      setError(r.error || 'Failed')
      return
    }
    setSuccess('অর্ডার সফল হয়েছে! ২ ঘন্টার ভিতরে ইমেইলে পেয়ে যাবেন।')
    setBuyerEmail(''); setNagadNumber(''); setTrx(''); setNote(''); setCoupon(''); setCouponInfo(null)
  }

  if (loading) return <div>Loading...</div>
  if (!game) return <div className="text-red-600">Could not load game. Please try again later.</div>

  const discounted = couponInfo?.valid ? Math.round(game.price * (1 - couponInfo.discount_percent/100) * 100) / 100 : game.price

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="aspect-video bg-gray-100 rounded overflow-hidden">
          {game.images?.[0] ? <img src={game.images[0]} alt={game.title} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-gray-400">No Image</div>}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{game.title}</h1>
        <p className="text-gray-600 mt-2 whitespace-pre-wrap">{game.description}</p>
        <Reviews gameId={id} />
      </div>
      <div className="bg-white rounded-lg shadow p-5 h-fit">
        <div className="text-xl font-bold text-indigo-600">৳ {discounted} {couponInfo?.valid && <span className="text-sm text-gray-500 line-through ml-2">৳ {game.price}</span>}</div>
        <div className="text-sm text-gray-500">Platform: {game.platform?.toUpperCase()}</div>
        <div className="text-sm mt-1">Stock: {game.stock_count ?? 0} {(!game.in_stock || (game.stock_count ?? 0) <= 0) && <span className="text-red-600">(Out of stock)</span>}</div>
        <ol className="list-decimal list-inside text-sm text-gray-700 bg-indigo-50 p-3 rounded mt-3">
          <li>Nagad এ Send Money করুন (Merchant নয়)</li>
          <li>Transaction ID (TRX) কপি করুন</li>
          <li>নিচের ফর্মটি পূরণ করুন — ইমেইলে গেম রিসিভ করবেন</li>
          <li>২ ঘন্টার মধ্যে অর্ডার সম্পন্ন হবে</li>
        </ol>
        <div className="mt-3 flex gap-2">
          <input value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 px-3 py-2 border rounded"/>
          <button onClick={checkCoupon} className="px-3 py-2 bg-gray-100 rounded">Apply</button>
        </div>
        {couponInfo && (
          <div className={`mt-2 text-sm ${couponInfo.valid ? 'text-green-700':'text-red-600'}`}>
            {couponInfo.valid ? `Coupon applied: -${couponInfo.discount_percent}%` : `Invalid: ${couponInfo.reason || ''}`}
          </div>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input required type="email" value={buyerEmail} onChange={e=>setBuyerEmail(e.target.value)} placeholder="আপনার ইমেইল" className="w-full px-3 py-2 border rounded"/>
          <input required value={nagadNumber} onChange={e=>setNagadNumber(e.target.value)} placeholder="Nagad Number" className="w-full px-3 py-2 border rounded"/>
          <div className="flex gap-2">
            <input required value={trx} onChange={e=>setTrx(e.target.value)} placeholder="Transaction ID (TRX)" className="flex-1 px-3 py-2 border rounded"/>
            <button type="button" onClick={verifyTrx} className="px-3 py-2 bg-gray-100 rounded">Quick Verify</button>
          </div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" className="w-full px-3 py-2 border rounded"/>
          <button disabled={!game.in_stock || (game.stock_count ?? 0) <= 0} className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">অর্ডার কনফার্ম</button>
        </form>
        {success && <div className="mt-3 text-green-600 text-sm">{success}</div>}
        {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  )
}

function AdminPage() {
  const saved = localStorage.getItem('auth')
  const auth = saved ? JSON.parse(saved) : null
  const token = auth?.token
  const isAdmin = auth?.role === 'admin'
  const nav = useNavigate()

  useEffect(() => { if (!isAdmin) nav('/auth') }, [isAdmin])

  const [games, setGames] = useState([])
  const [orders, setOrders] = useState([])
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({ title:'', description:'', price:'', platform:'pc', category:'', images:'', in_stock:true, stock_count:0, featured:false })
  const [couponForm, setCouponForm] = useState({ code:'', discount_percent:'', active:true, expires_at:'' })
  const [message, setMessage] = useState('')

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', 'x-auth-token': token || '' }), [token])

  const load = async () => {
    const [g, o, c] = await Promise.all([
      jfetch(`${API_BASE}/games`),
      jfetch(`${API_BASE}/admin/orders`, { headers }),
      jfetch(`${API_BASE}/admin/coupons`, { headers })
    ])
    setGames(g.ok && Array.isArray(g.data) ? g.data : [])
    setOrders(o.ok && Array.isArray(o.data) ? o.data : [])
    setCoupons(c.ok && Array.isArray(c.data) ? c.data : [])
  }
  useEffect(() => { load() }, [])

  const submitGame = async (e) => {
    e.preventDefault()
    setMessage('')
    const payload = { ...form, price: Number(form.price), stock_count: Number(form.stock_count)||0, images: form.images ? form.images.split(',').map(s=>s.trim()).filter(Boolean) : [] }
    const r = await jfetch(`${API_BASE}/admin/games`, { method:'POST', headers, body: JSON.stringify(payload) })
    if (!r.ok) { setMessage(r.error || 'Failed'); return }
    setForm({ title:'', description:'', price:'', platform:'pc', category:'', images:'', in_stock:true, stock_count:0, featured:false })
    setMessage('নতুন গেম যোগ হয়েছে')
    load()
  }

  const delGame = async (id) => {
    if (!confirm('Delete this game?')) return
    await jfetch(`${API_BASE}/admin/games/${id}`, { method:'DELETE', headers })
    load()
  }

  const updateOrder = async (id, status) => {
    await jfetch(`${API_BASE}/admin/orders/${id}`, { method:'PUT', headers, body: JSON.stringify({ status }) })
    load()
  }

  const submitCoupon = async (e) => {
    e.preventDefault()
    const payload = { ...couponForm, discount_percent: Number(couponForm.discount_percent), code: couponForm.code.toUpperCase() }
    await jfetch(`${API_BASE}/admin/coupons`, { method:'POST', headers, body: JSON.stringify(payload) })
    setCouponForm({ code:'', discount_percent:'', active:true, expires_at:'' })
    load()
  }

  const toggleCoupon = async (c) => {
    await jfetch(`${API_BASE}/admin/coupons/${c.id}`, { method:'PUT', headers, body: JSON.stringify({ active: !c.active }) })
    load()
  }

  const delCoupon = async (c) => {
    if (!confirm('Delete coupon?')) return
    await jfetch(`${API_BASE}/admin/coupons/${c.id}`, { method:'DELETE', headers })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 h-fit">
          <h2 className="font-semibold mb-3">Add New Game</h2>
          <form onSubmit={submitGame} className="space-y-2">
            <input value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))} placeholder="Title" className="w-full px-3 py-2 border rounded"/>
            <textarea value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} placeholder="Description" className="w-full px-3 py-2 border rounded"/>
            <input value={form.price} onChange={e=>setForm(v=>({...v,price:e.target.value}))} placeholder="Price (BDT)" className="w-full px-3 py-2 border rounded"/>
            <select value={form.platform} onChange={e=>setForm(v=>({...v,platform:e.target.value}))} className="w-full px-3 py-2 border rounded">
              <option value="pc">PC</option>
              <option value="mobile">Mobile</option>
            </select>
            <input value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))} placeholder="Category" className="w-full px-3 py-2 border rounded"/>
            <input value={form.images} onChange={e=>setForm(v=>({...v,images:e.target.value}))} placeholder="Image URLs (comma separated)" className="w-full px-3 py-2 border rounded"/>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.in_stock} onChange={e=>setForm(v=>({...v,in_stock:e.target.checked}))}/> In Stock</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={e=>setForm(v=>({...v,featured:e.target.checked}))}/> Featured</label>
            </div>
            <input value={form.stock_count} onChange={e=>setForm(v=>({...v,stock_count:e.target.value}))} placeholder="Stock count" className="w-full px-3 py-2 border rounded"/>
            <button className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Game</button>
          </form>
          {message && <div className="mt-2 text-sm">{message}</div>}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {games.map(g => (
                <div key={g.id} className="border rounded p-3 flex gap-3 items-center">
                  <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden">
                    {g.images?.[0] ? <img src={g.images[0]} className="w-full h-full object-cover"/> : null}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{g.title}</div>
                    <div className="text-sm text-gray-500">৳ {g.price} • {g.platform?.toUpperCase()} • Stock: {g.stock_count ?? 0}</div>
                  </div>
                  <button onClick={()=>delGame(g.id)} className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Buyer</th>
                    <th>TRX</th>
                    <th>Coupon</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t">
                      <td className="py-2">{o.buyer_email}</td>
                      <td>{o.transaction_id}</td>
                      <td>{o.coupon_code || '-'}</td>
                      <td>{o.total_price ?? '-'}</td>
                      <td>{o.status}</td>
                      <td className="space-x-2">
                        <button onClick={()=>updateOrder(o.id,'processing')} className="px-2 py-1 bg-amber-100 text-amber-700 rounded">Processing</button>
                        <button onClick={()=>updateOrder(o.id,'completed')} className="px-2 py-1 bg-green-100 text-green-700 rounded">Complete</button>
                        <button onClick={()=>updateOrder(o.id,'cancelled')} className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-3">Coupons</h2>
        <form onSubmit={submitCoupon} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <input value={couponForm.code} onChange={e=>setCouponForm(v=>({...v,code:e.target.value}))} placeholder="CODE" className="px-3 py-2 border rounded"/>
          <input value={couponForm.discount_percent} onChange={e=>setCouponForm(v=>({...v,discount_percent:e.target.value}))} placeholder="Discount %" className="px-3 py-2 border rounded"/>
          <input value={couponForm.expires_at} onChange={e=>setCouponForm(v=>({...v,expires_at:e.target.value}))} placeholder="Expires (YYYY-MM-DD)" className="px-3 py-2 border rounded"/>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={couponForm.active} onChange={e=>setCouponForm(v=>({...v,active:e.target.checked}))}/> Active</label>
          <button className="px-3 py-2 bg-indigo-600 text-white rounded">Add</button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {coupons.map(c => (
            <div key={c.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.code} • {c.discount_percent}%</div>
                <div className="text-sm text-gray-500">Active: {String(c.active)}{c.expires_at ? ` • Expires: ${c.expires_at}`: ''}</div>
              </div>
              <div className="space-x-2">
                <button onClick={()=>toggleCoupon(c)} className="px-2 py-1 bg-gray-100 rounded">{c.active?'Disable':'Enable'}</button>
                <button onClick={()=>delCoupon(c)} className="px-2 py-1 bg-red-100 text-red-700 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AuthPage() {
  const nav = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(''); setLoading(true)
    try {
      if (mode === 'register') {
        const r = await jfetch(`${API_BASE}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) })
        if (!r.ok) throw new Error(r.error || 'Registration failed')
        const data = r.data
        localStorage.setItem('auth', JSON.stringify({ token: data.token, role: data.role, name: data.name, email: data.email }))
        setMsg('অ্যাকাউন্ট তৈরি হয়েছে!')
        nav('/')
      } else {
        const r = await jfetch(`${API_BASE}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
        if (!r.ok) throw new Error(r.error || 'Login failed')
        const data = r.data
        localStorage.setItem('auth', JSON.stringify({ token: data.token, role: data.role, name: data.name, email: data.email }))
        setMsg('লগইন সফল')
        nav('/')
      }
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div className="hidden md:block">
        <div className="h-full w-full rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-1">
          <div className="h-full w-full rounded-[10px] bg-white/10 backdrop-blur p-8 text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">RS <span className="opacity-80">GAME</span> GHOR</div>
            <h2 className="mt-4 text-3xl font-extrabold">One-stop digital store for gamers</h2>
            <ul className="mt-4 space-y-2 text-white/90">
              <li>• Pay with Nagad Send Money</li>
              <li>• 2-hour email delivery</li>
              <li>• Coupons, reviews & featured deals</li>
              <li>• Admin panel with stock control</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-white shadow rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{mode === 'login' ? 'Login' : 'Create account'}</h2>
          <button onClick={()=>setMode(mode==='login'?'register':'login')} className="text-indigo-600 hover:underline text-sm">
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2 border rounded"/>
          )}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded"/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full px-3 py-2 border rounded"/>
          <button disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Please wait...' : (mode==='login' ? 'Login' : 'Register')}
          </button>
          {msg && <div className="text-sm mt-2">{msg}</div>}
        </form>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GamesList/>} />
        <Route path="/game/:id" element={<GameDetails/>} />
        <Route path="/auth" element={<AuthPage/>} />
        <Route path="/admin" element={<AdminPage/>} />
      </Routes>
    </Layout>
  )
}
