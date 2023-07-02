const { Pool } = require('pg')
const { nanoid } = require('nanoid')
const InvariantError = require('../exceptions/InvariantError')
const { mapDBToModelSong } = require('../utils')
const NotFoundError = require('../exceptions/NotFoundError')

class SongService {
  constructor() {
    this._pool = new Pool()
  }

  async addSong({ title, year, performer, genre, duration, albumId }) {
    const id = `song-${nanoid(16)}`
    const createdAt = new Date().toISOString()
    const updatedAt = createdAt

    const query = {
      text: 'INSERT INTO song VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      values: [id, title, year, performer, genre, duration, albumId, createdAt, updatedAt]
    }

    const result = await this._pool.query(query)

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan')
    }

    return result.rows[0].id
  }

  async getSongs(title, performer) {
    if (title && performer) {
      const result = await this._pool.query(`SELECT id, title, performer FROM song WHERE LOWER(performer) LIKE '%${performer}%' AND LOWER(title) LIKE '%${title}%'`)

      return result.rows.map(mapDBToModelSong)
    }

    if (title || performer) {
      const result = await this._pool.query(`SELECT id, title, performer FROM song WHERE LOWER(performer) LIKE '%${performer}%' OR LOWER(title) LIKE '%${title}%'`)

      return result.rows.map(mapDBToModelSong)
    }

    const result = await this._pool.query('SELECT id, title, performer FROM song')

    return result.rows.map(mapDBToModelSong)
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM song WHERE id = $1',
      values: [id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan')
    }

    return result.rows.map(mapDBToModelSong)[0]
  }

  async editSongById(id, { title, year, performer, genre, duration, albumId }) {
    const updatedAt = new Date().toISOString()
    const query = {
      text: 'UPDATE song SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6, updated_at = $7 WHERE id = $8 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, updatedAt, id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan')
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM song WHERE id = $1 RETURNING id',
      values: [id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan')
    }
  }
}

module.exports = SongService