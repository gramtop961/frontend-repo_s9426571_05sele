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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600">GameStore</Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-gray-700 hover:text-indigo-600">All Games</Link>
            {isAdmin && <Link to="/admin" className="text-gray-700 hover:text-indigo-600">Admin</Link>}
            {user ? (
              <button onClick={logout} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Logout</button>
            ) : (
              <Link to="/auth" className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t text-center text-sm text-gray-500 py-6">© {new Date().getFullYear()} GameStore — Pay via Nagad Send Money</footer>
    </div>
  )
}

function GamesList() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [platform, setPlatform] = useState('')

  const load = async () => {
    setLoading(true)
    const url = new URL(API_BASE + '/games')
    if (q) url.searchParams.set('q', q)
    if (platform) url.searchParams.set('platform', platform)
    const res = await fetch(url)
    const data = await res.json()
    setGames(data)
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

function GameDetails() {
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [nagadNumber, setNagadNumber] = useState('')
  const [trx, setTrx] = useState('')
  const [note, setNote] = useState('')
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

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: id, buyer_email: buyerEmail, nagad_number: nagadNumber, transaction_id: trx, note })
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
      const data = await res.json()
      setSuccess('অর্ডার সফল হয়েছে! ২ ঘন্টার ভিতরে ইমেইলে পেয়ে যাবেন।')
      setBuyerEmail(''); setNagadNumber(''); setTrx(''); setNote('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!game) return <div>Not found</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="aspect-video bg-gray-100 rounded overflow-hidden">
          {game.images?.[0] ? <img src={game.images[0]} alt={game.title} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-gray-400">No Image</div>}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{game.title}</h1>
        <p className="text-gray-600 mt-2 whitespace-pre-wrap">{game.description}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-5 h-fit">
        <div className="text-xl font-bold text-indigo-600">৳ {game.price}</div>
        <div className="text-sm text-gray-500 mb-4">Platform: {game.platform?.toUpperCase()}</div>
        <ol className="list-decimal list-inside text-sm text-gray-700 bg-indigo-50 p-3 rounded">
          <li>Nagad এ Send Money করুন (Merchant নয়)</li>
          <li>Transaction ID (TRX) কপি করুন</li>
          <li>নিচের ফর্মটি পূরণ করুন — ইমেইলে গেম রিসিভ করবেন</li>
          <li>২ ঘন্টার মধ্যে অর্ডার সম্পন্ন হবে</li>
        </ol>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input required type="email" value={buyerEmail} onChange={e=>setBuyerEmail(e.target.value)} placeholder="আপনার ইমেইল" className="w-full px-3 py-2 border rounded"/>
          <input required value={nagadNumber} onChange={e=>setNagadNumber(e.target.value)} placeholder="Nagad Number" className="w-full px-3 py-2 border rounded"/>
          <input required value={trx} onChange={e=>setTrx(e.target.value)} placeholder="Transaction ID (TRX)" className="w-full px-3 py-2 border rounded"/>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" className="w-full px-3 py-2 border rounded"/>
          <button className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">অর্ডার কনফার্ম</button>
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
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <div className="flex justify-between mb-4">
        <button onClick={()=>setIsLogin(true)} className={`px-3 py-1.5 rounded ${isLogin? 'bg-indigo-600 text-white':'bg-gray-100'}`}>Login</button>
        <button onClick={()=>setIsLogin(false)} className={`px-3 py-1.5 rounded ${!isLogin? 'bg-indigo-600 text-white':'bg-gray-100'}`}>Register</button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {!isLogin && (
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 border rounded"/>
        )}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full px-3 py-2 border rounded"/>
        {!isLogin && (
          <input value={adminCode} onChange={e=>setAdminCode(e.target.value)} placeholder="Admin Code (optional)" className="w-full px-3 py-2 border rounded"/>
        )}
        <button className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
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
  const [form, setForm] = useState({ title:'', description:'', price:'', platform:'pc', category:'', images:'', in_stock:true })
  const [message, setMessage] = useState('')

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', 'x-auth-token': token || '' }), [token])

  const load = async () => {
    const g = await fetch(`${API_BASE}/games`).then(r=>r.json())
    setGames(g)
    const o = await fetch(`${API_BASE}/admin/orders`, { headers }).then(async r=> r.ok? r.json(): [])
    setOrders(o)
  }
  useEffect(() => { load() }, [])

  const submitGame = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const payload = { ...form, price: Number(form.price), images: form.images ? form.images.split(',').map(s=>s.trim()).filter(Boolean) : [] }
      const res = await fetch(`${API_BASE}/admin/games`, { method:'POST', headers, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
      setForm({ title:'', description:'', price:'', platform:'pc', category:'', images:'', in_stock:true })
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

  return (
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
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.in_stock} onChange={e=>setForm(v=>({...v,in_stock:e.target.checked}))}/> In Stock</label>
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
                  <div className="text-sm text-gray-500">৳ {g.price} • {g.platform?.toUpperCase()}</div>
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
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2">{o.buyer_email}</td>
                    <td>{o.transaction_id}</td>
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
