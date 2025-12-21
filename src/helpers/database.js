const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { app } = require("electron");

class DatabaseManager {
  constructor() {
    this.db = null;
    this.initDatabase();
  }

  initDatabase() {
    try {
      const dbFileName =
        process.env.NODE_ENV === "development"
          ? "transcriptions-dev.db"
          : "transcriptions.db";

      const dbPath = path.join(app.getPath("userData"), dbFileName);

      this.db = new Database(dbPath);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS transcriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration: Add duration_seconds column if it doesn't exist
      try {
        const tableInfo = this.db.pragma('table_info(transcriptions)');
        const hasDuration = tableInfo.some(col => col.name === 'duration_seconds');
        if (!hasDuration) {
          this.db.exec('ALTER TABLE transcriptions ADD COLUMN duration_seconds REAL DEFAULT NULL');
          console.log('✅ Added duration_seconds column to transcriptions table');
        }
      } catch (migrationError) {
        console.error('Migration warning:', migrationError.message);
      }

      return true;
    } catch (error) {
      console.error("Database initialization failed:", error.message);
      throw error;
    }
  }

  saveTranscription(text, durationSeconds = null) {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }
      const stmt = this.db.prepare(
        "INSERT INTO transcriptions (text, duration_seconds) VALUES (?, ?)"
      );
      const result = stmt.run(text, durationSeconds);

      return { id: result.lastInsertRowid, success: true };
    } catch (error) {
      console.error("Error saving transcription:", error.message);
      throw error;
    }
  }

  getTranscriptions(limit = 50) {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }
      const stmt = this.db.prepare(
        "SELECT * FROM transcriptions ORDER BY timestamp DESC LIMIT ?"
      );
      const transcriptions = stmt.all(limit);
      return transcriptions;
    } catch (error) {
      console.error("Error getting transcriptions:", error.message);
      throw error;
    }
  }

  clearTranscriptions() {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }
      const stmt = this.db.prepare("DELETE FROM transcriptions");
      const result = stmt.run();
      return { cleared: result.changes, success: true };
    } catch (error) {
      console.error("Error clearing transcriptions:", error.message);
      throw error;
    }
  }

  deleteTranscription(id) {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }
      const stmt = this.db.prepare("DELETE FROM transcriptions WHERE id = ?");
      const result = stmt.run(id);
      console.log(
        `🗑️ Deleted transcription ${id}, affected rows: ${result.changes}`
      );
      return { success: result.changes > 0 };
    } catch (error) {
      console.error("❌ Error deleting transcription:", error);
      throw error;
    }
  }

  getStatistics() {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      // Get total transcriptions count
      const countStmt = this.db.prepare("SELECT COUNT(*) as total FROM transcriptions");
      const { total } = countStmt.get();

      // Get total word count from all transcriptions
      const textsStmt = this.db.prepare("SELECT text, duration_seconds FROM transcriptions");
      const transcriptions = textsStmt.all();

      let totalWords = 0;
      let totalDurationSeconds = 0;
      let transcriptionsWithDuration = 0;

      for (const t of transcriptions) {
        // Count words (split by whitespace, filter empty strings)
        const words = t.text.split(/\s+/).filter(w => w.length > 0);
        totalWords += words.length;

        if (t.duration_seconds != null && t.duration_seconds > 0) {
          totalDurationSeconds += t.duration_seconds;
          transcriptionsWithDuration++;
        }
      }

      // Get unique days used
      const daysStmt = this.db.prepare(`
        SELECT COUNT(DISTINCT date(timestamp)) as days_used
        FROM transcriptions
      `);
      const { days_used } = daysStmt.get();

      // Calculate average words per minute
      let averageWpm = 0;
      if (totalDurationSeconds > 0) {
        const totalMinutes = totalDurationSeconds / 60;
        averageWpm = Math.round(totalWords / totalMinutes);
      }

      // Get first and last transcription dates
      const dateRangeStmt = this.db.prepare(`
        SELECT
          MIN(timestamp) as first_transcription,
          MAX(timestamp) as last_transcription
        FROM transcriptions
      `);
      const dateRange = dateRangeStmt.get();

      return {
        totalTranscriptions: total,
        totalWords,
        daysUsed: days_used,
        totalDurationSeconds,
        averageWpm,
        transcriptionsWithDuration,
        firstTranscription: dateRange.first_transcription,
        lastTranscription: dateRange.last_transcription
      };
    } catch (error) {
      console.error("Error getting statistics:", error.message);
      return {
        totalTranscriptions: 0,
        totalWords: 0,
        daysUsed: 0,
        totalDurationSeconds: 0,
        averageWpm: 0,
        transcriptionsWithDuration: 0,
        firstTranscription: null,
        lastTranscription: null
      };
    }
  }

  cleanup() {
    console.log("Starting database cleanup...");
    try {
      const dbPath = path.join(
        app.getPath("userData"),
        process.env.NODE_ENV === "development"
          ? "transcriptions-dev.db"
          : "transcriptions.db"
      );
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log("✅ Database file deleted:", dbPath);
      }
    } catch (error) {
      console.error("❌ Error deleting database file:", error);
    }
  }
}

module.exports = DatabaseManager;
