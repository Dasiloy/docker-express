import React, { Component } from "react";
import axios from "axios";

class Fib extends Component {
  state = {
    values: [],
    indices: [],
    index: "",
  };

  componentDidMount() {
    this.fetchValues();
    this.fetchIndexes();
  }

  async fetchValues() {
    const values = await axios.get("/api/values");

    this.setState({ values: values.data });
  }

  async fetchIndexes() {
    const seenIndexes = await axios.get("/api/indices");
    this.setState({
      indices: seenIndexes.data,
    });
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    await axios.post("/api/index", {
      index: this.state.index,
    });
    this.setState({ index: "" });
  };

  renderSeenIndexes() {
    return this.state.indices.map(({ index }) => index).join(", ");
  }

  renderValues() {
    return this.state.values.map((v) => {
      return (
        <div key={v.index}>
          For index {v.index} I calculated {v.value}
        </div>
      );
    });
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>Enter your index:</label>
          <input
            value={this.state.index}
            onChange={(event) => this.setState({ index: event.target.value })}
          />
          <button>Submit</button>
        </form>

        <h3>Indexes I have seen:</h3>
        {this.renderSeenIndexes()}

        <h3>Calculated Values:</h3>
        {this.renderValues()}
      </div>
    );
  }
}

export default Fib;
