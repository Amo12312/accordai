// Simple in-memory user storage for development
// In production, this should use a real database

class MemoryUserStore {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  async findOne(query) {
    const users = Array.from(this.users.values());
    
    if (query.email) {
      return users.find(user => user.email === query.email) || null;
    }
    
    if (query._id || query.id) {
      const id = query._id || query.id;
      return this.users.get(id) || null;
    }

    if (query.googleId) {
      return users.find(user => user.googleId === query.googleId) || null;
    }

    if (query.passwordResetToken) {
      return users.find(user => 
        user.passwordResetToken === query.passwordResetToken &&
        user.passwordResetExpiry && 
        new Date() < user.passwordResetExpiry
      ) || null;
    }

    if (query.$or) {
      for (let condition of query.$or) {
        const result = await this.findOne(condition);
        if (result) return result;
      }
    }

    return null;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async save(userData) {
    if (!userData._id) {
      userData._id = this.nextId.toString();
      this.nextId++;
    }
    
    this.users.set(userData._id, { ...userData });
    return { ...userData };
  }

  async create(userData) {
    const user = {
      _id: this.nextId.toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.nextId++;
    
    this.users.set(user._id, user);
    return user;
  }
}

// Mock User model that mimics Mongoose behavior
class MockUser {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    return userStore.save(this);
  }

  static async findOne(query) {
    return userStore.findOne(query);
  }

  static async findById(id) {
    return userStore.findById(id);
  }

  static async create(data) {
    return userStore.create(data);
  }

  select(fields) {
    // Simple implementation - in real Mongoose, this would exclude password
    if (fields === '-password') {
      const { password, ...userWithoutPassword } = this;
      return userWithoutPassword;
    }
    return this;
  }
}

const userStore = new MemoryUserStore();

module.exports = MockUser;
