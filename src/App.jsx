import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

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
  const [q, setQ] = useState('')
  const [platform, setPlatform] = useState('')

  const load = async () => {
    setLoading(true)
    const url = new URL(API_BASE + '/games')
    if (q) url.searchParams.set('q', q)
    if (platform) url.searchParams.set('platform', platform)
    const [allRes, featRes] = await Promise.all([
      fetch(url),
      fetch(`${API_BASE}/games?featured=true`)
    ])
    const data = await allRes.json()
    const feat = await featRes.json()
    setGames(data)
    setFeatured(feat)
    setLoading(false)
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
    const res = await fetch(`${API_BASE}/games/${gameId}/reviews`)
    const data = await res.json()
    setReviews(data)
  }
  useEffect(() => { load() }, [gameId])

  const submit = async (e) => {
    e.preventDefault()
    await fetch(`${API_BASE}/games/${gameId}/reviews`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ rating: Number(rating), comment, author }) })
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
      const res = await fetch(`${API_BASE}/games/${id}`)
      const data = await res.json()
      setGame(data)
      setLoading(false)
    }
    run()
  }, [id])

  const checkCoupon = async () => {
    if (!coupon) return
    const res = await fetch(`${API_BASE}/coupons/validate`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code: coupon, game_id: id }) })
    const data = await res.json()
    setCouponInfo(data)
  }

  const verifyTrx = async () => {
    if (!trx) return
    const res = await fetch(`${API_BASE}/verify/nagad`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nagad_number: nagadNumber, transaction_id: trx, amount: game?.price }) })
    const data = await res.json()
    alert(data.verified ? 'TRX looks valid.' : `Not verified: ${data.reason || ''}`)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: id, buyer_email: buyerEmail, nagad_number: nagadNumber, transaction_id: trx, note, coupon_code: coupon || undefined })
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
      await res.json()
      setSuccess('অর্ডার সফল হয়েছে! ২ ঘন্টার ভিতরে ইমেইলে পেয়ে যাবেন।')
      setBuyerEmail(''); setNagadNumber(''); setTrx(''); setNote(''); setCoupon(''); setCouponInfo(null)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!game) return <div>Not found</div>

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

function AuthPage() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const url = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`
      const body = isLogin ? { email, password } : { name, email, password, admin_code: adminCode || undefined }
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
      const data = await res.json()
      login(data)
      nav('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left/Brand panel */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8 md:p-10">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_30%,white,transparent_35%),radial-gradient(circle_at_30%_80%,white,transparent_35%)]"/>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-white/20 grid place-items-center font-extrabold">RS</div>
                <div>
                  <div className="text-2xl font-black tracking-tight">RS GAME GHOR</div>
                  <div className="text-xs text-white/80">Play more. Pay smart. Nagad ready.</div>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-white"/> ফাস্ট চেকআউট — ২ ঘন্টার মধ্যে ইমেইল ডেলিভারি</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-white"/> কুপন/ডিসকাউন্ট ও স্টক আপডেট রিয়েল টাইম</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-white"/> Nagad TRX কুইক ভেরিফাই সাপোর্ট</li>
              </ul>
              <div className="mt-8 text-xs text-white/70">By continuing, you agree to our Terms & Privacy.</div>
            </div>
          </div>
          {/* Right/Form panel */}
          <div className="bg-white p-6 sm:p-8">
            <div className="flex mb-6 rounded-lg overflow-hidden border w-full">
              <button onClick={()=>setIsLogin(true)} className={`flex-1 px-4 py-2 text-sm font-medium ${isLogin? 'bg-indigo-600 text-white':'bg-gray-50 hover:bg-gray-100'}`}>Login</button>
              <button onClick={()=>setIsLogin(false)} className={`flex-1 px-4 py-2 text-sm font-medium ${!isLogin? 'bg-indigo-600 text-white':'bg-gray-50 hover:bg-gray-100'}`}>Register</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              {!isLogin && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Your Name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rafi Shanto" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200"/>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200"/>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200"/>
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Admin Code (optional)</label>
                  <input value={adminCode} onChange={e=>setAdminCode(e.target.value)} placeholder="Enter admin code if provided" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200"/>
                </div>
              )}
              <button className="w-full py-2.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm">{isLogin ? 'Login' : 'Create Account'}</button>
            </form>
            {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
            <div className="mt-6 text-[11px] text-gray-500">
              Need admin access? Use the secret admin code during registration.
            </div>
          </div>
        </div>
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
      fetch(`${API_BASE}/games`).then(r=>r.json()),
      fetch(`${API_BASE}/admin/orders`, { headers }).then(async r=> r.ok? r.json(): []),
      fetch(`${API_BASE}/admin/coupons`, { headers }).then(async r=> r.ok? r.json(): [])
    ])
    setGames(g); setOrders(o); setCoupons(c)
  }
  useEffect(() => { load() }, [])

  const submitGame = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const payload = { ...form, price: Number(form.price), stock_count: Number(form.stock_count)||0, images: form.images ? form.images.split(',').map(s=>s.trim()).filter(Boolean) : [] }
      const res = await fetch(`${API_BASE}/admin/games`, { method:'POST', headers, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
      setForm({ title:'', description:'', price:'', platform:'pc', category:'', images:'', in_stock:true, stock_count:0, featured:false })
      setMessage('নতুন গেম যোগ হয়েছে')
      load()
    } catch (e) { setMessage(e.message) }
  }

  const delGame = async (id) => {
    if (!confirm('Delete this game?')) return
    await fetch(`${API_BASE}/admin/games/${id}`, { method:'DELETE', headers })
    load()
  }

  const updateOrder = async (id, status) => {
    await fetch(`${API_BASE}/admin/orders/${id}`, { method:'PUT', headers, body: JSON.stringify({ status }) })
    load()
  }

  const submitCoupon = async (e) => {
    e.preventDefault()
    const payload = { ...couponForm, discount_percent: Number(couponForm.discount_percent), code: couponForm.code.toUpperCase() }
    await fetch(`${API_BASE}/admin/coupons`, { method:'POST', headers, body: JSON.stringify(payload) })
    setCouponForm({ code:'', discount_percent:'', active:true, expires_at:'' })
    load()
  }

  const toggleCoupon = async (c) => {
    await fetch(`${API_BASE}/admin/coupons/${c.id}`, { method:'PUT', headers, body: JSON.stringify({ active: !c.active }) })
    load()
  }

  const delCoupon = async (c) => {
    if (!confirm('Delete coupon?')) return
    await fetch(`${API_BASE}/admin/coupons/${c.id}`, { method:'DELETE', headers })
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

function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<GamesList/>} />
          <Route path="/game/:id" element={<GameDetails/>} />
          <Route path="/auth" element={<AuthPage/>} />
          <Route path="/admin" element={<AdminPage/>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default AppRouter
