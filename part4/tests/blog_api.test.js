const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)

jest.setTimeout(20000)

const initialBlogs = [
  {
    title: 'Test title',
    author: 'Daniel',
    url: 'http://localhost:3001',
    likes: 1,
  },
  {
    title: 'Test title2',
    author: 'Daniel2',
    url: 'http://localhost:3002',
    likes: 2,
  }
]

beforeEach(async () => {
  await Blog.deleteMany({})
  const blogObjects = initialBlogs.map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

test('correct amount of blogs are returned', async () => {
  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(initialBlogs.length)
})

test('the unique identifier is named id', async () => {
  const response = await api.get('/api/blogs')
  response.body.map(b => expect(b.id).toBeDefined())
})

test('post to /api/blogs creates new blog', async () => {
  const newBlog = {
    title: 'Test title3',
    author: 'Daniel3',
    url: 'http://localhost:3003',
    likes: 3,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  const authors = response.body.map(blog => blog.author)
  const likes = response.body.map(blog => blog.likes)
  const titles = response.body.map(blog => blog.title)
  const urls = response.body.map(blog => blog.url)
  expect(response.body).toHaveLength(initialBlogs.length + 1)
  expect(authors).toContain(newBlog.author)
  expect(likes).toContain(newBlog.likes)
  expect(urls).toContain(newBlog.url)
  expect(titles).toContain(newBlog.title)
})

test('post to /api/blogs without likes will have default 0 likes', async () => {
  const newBlog = {
    title: "Title3",
    author: "Daniel3",
    url: "http://localhost:3003"
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  
  const likes = response.body.map(blog => blog.likes)

  expect(likes).toContain(0)
})

test('post without title and url will be responded with 400', async () => {
  const newBlog = {
    author: "Daniel3",
    likes: 1
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

test('delete the first blog', async () => {
  const initialResponse = await api.get('/api/blogs')
  const blogToDeleteId = initialResponse.body[0].id
  await api
    .delete('/api/blogs/' + blogToDeleteId)
    .expect(204)
  
  const responseAfterDeletion = await api.get('/api/blogs')
  const blogAfterDeletionIds = responseAfterDeletion.body.map(blog => blog.id)
  expcet(blogAfterDeletionIds).toHaveLength(initialResponse.length - 1)
  expect(blogAfterDeletionIds).not.toContain(blogToDeleteId)
})

test('update the first blog', async () => {
  const initialResponse = await api.get('/api/blogs')
  const blogToUpdateId = initialResponse.body[0].id
  const updatedBlog = {
    title: "Updated title",
    url: "http://localhost:2000",
    likes: "1",
    author: "Daniel9"
  }
  await api
    .put('/api/blogs/' + blogToUpdateId)
    .send(updatedBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAfterUpdate = await api.get('/api/blogs')
  const titles = blogsAfterUpdate.body.map(blog => blog.title)
  expect(blogsAfterUpdate.body).toHaveLength(initialBlogs.length)
  expect(titles).toContain(updatedBlog.title)
})

afterAll(() => {
  mongoose.connection.close()
})