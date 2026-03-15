const { createClient } = require('@supabase/supabase-js')

const adminSupabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  // Verify caller is admin by checking their JWT
  const authHeader = event.headers.authorization
  if (!authHeader) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token)
  if (authError || !user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  // Check caller is admin
  const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) }

  const body = JSON.parse(event.body || '{}')
  const { action } = body

  try {
    if (action === 'list') {
      const { data: { users } } = await adminSupabase.auth.admin.listUsers()
      const { data: profiles } = await adminSupabase.from('profiles').select('*')
      const profileMap = {}
      profiles?.forEach(p => profileMap[p.id] = p)
      const merged = users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
        full_name: profileMap[u.id]?.full_name || '',
        role: profileMap[u.id]?.role || 'assessor',
        department: profileMap[u.id]?.department || '',
        banned_until: u.banned_until
      }))
      return { statusCode: 200, headers, body: JSON.stringify(merged) }
    }

    if (action === 'create') {
      const { email, password, full_name, role, department } = body
      const { data: { user: newUser }, error } = await adminSupabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name }
      })
      if (error) return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) }
      await adminSupabase.from('profiles').insert([{ id: newUser.id, full_name, role: role || 'assessor', department: department || '' }])
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, user: newUser }) }
    }

    if (action === 'update') {
      const { userId, full_name, role, department } = body
      await adminSupabase.from('profiles').upsert({ id: userId, full_name, role, department })
      if (full_name) await adminSupabase.auth.admin.updateUserById(userId, { user_metadata: { full_name } })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    if (action === 'deactivate') {
      const { userId } = body
      await adminSupabase.auth.admin.updateUserById(userId, { ban_duration: '87600h' })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    if (action === 'reactivate') {
      const { userId } = body
      await adminSupabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    if (action === 'reset_password') {
      const { userId, new_password } = body
      await adminSupabase.auth.admin.updateUserById(userId, { password: new_password })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) }
  }
}
