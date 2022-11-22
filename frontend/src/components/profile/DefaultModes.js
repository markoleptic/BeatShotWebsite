import { useState, useEffect, useRef } from "react";
import LineChart from "../Charts/LineChart";
import { DateTime } from "luxon";
import { useAuthContext } from "../../context/AuthProvider";
import SelectBox from "../SelectBox";
import { usePlayerDataContext } from "../../context/PlayerData";

const DefaultModes = () => {
  // Select box options
  const [gameModeOptions, setGameModeOptions] = useState([]);
  const [songOptions, setSongOptions] = useState([]);
  const [difficultyOptions, setDifficultyOptions] = useState([]);

  // Data passed to Line Chart
  const [scores, setScores] = useState();
  const [dates, setDates] = useState();

  // Best/Average Text Box values
  const [bestScore, setBestScore] = useState();
  const [bestAccuracy, setBestAccuracy] = useState();
  const [bestStreak, setBestStreak] = useState();
  const [bestCompletion, setBestCompletion] = useState();
  const [bestTimeOffset, setBestTimeOffset] = useState();
  const [avgScore, setAvgScore] = useState();
  const [avgAccuracy, setAvgAccuracy] = useState();
  const [avgStreak, setAvgStreak] = useState();
  const [avgCompletion, setAvgCompletion] = useState();
  const [avgTimeOffset, setAvgTimeOffset] = useState();

  // Tracks currently selected options from Select boxes
  const [selectedGameMode, setSelectedGameMode] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  // Hooks
  const { auth } = useAuthContext();
  const errRef = useRef();
  const { data, errMsg, setErrMsg } = usePlayerDataContext();

  // clear error message when Select box option changed
  useEffect(() => {
    setErrMsg("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameModeOptions, songOptions, difficultyOptions]);

  /* initial useEffect that gets data from PlayerDataContext
   * and calls functions to populate the options dropdowns */
  useEffect(() => {
    try {
      let datesArray = [];
      let gameModeArray = [];
      let songTitleArray = [];
      let difficultyArray = [];
      for (let object in data) {
        if (
          data[object].gameModeActorName !== "Custom" &&
          data[object].customGameModeName === ""
        ) {
          datesArray.push(data[object]);
          /* sets the game modes options */
          if (
            !gameModeArray.some(
              (e) => e.label === data[object].gameModeActorName
            )
          ) {
            gameModeArray.push({
              value: data[object].gameModeActorName,
              label: data[object].gameModeActorName,
            });
          }
          /* sets the song options */
          if (!songTitleArray.some((e) => e.label === data[object].songTitle)) {
            songTitleArray.push({
              value: data[object].songTitle,
              label: data[object].songTitle,
            });
          }
          /* sets the difficulty options */
          if (
            !difficultyArray.some((e) => e.label === data[object].difficulty)
          ) {
            difficultyArray.push({
              value: data[object].difficulty,
              label: data[object].difficulty,
            });
          }
        }
      }
      /* get the most recent score object and display the corresponding
       * game mode and song */
      let maxDateScoreObject = datesArray[0];
      for (let object in datesArray) {
        if (
          DateTime.fromISO(maxDateScoreObject.time) <=
          DateTime.fromISO(datesArray[object].time)
        ) {
          maxDateScoreObject = datesArray[object];
        }
      }
      setGameModeOptions(gameModeArray);
      setSongOptions(songTitleArray);
      setDifficultyOptions(difficultyArray);
      handleGameModeSelect(maxDateScoreObject.gameModeActorName);
      handleSongSelect(maxDateScoreObject.songTitle);
      handleDifficultySelect(maxDateScoreObject.difficulty);
    } catch (err) {
      console.log(err.message);
      setErrMsg(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  /* updates the charts and info boxes when selected gamemode or song changes */
  useEffect(() => {
    const getScores = () => {
      let scoreMap = new Map();
      for (let scoreObject in data) {
        if (
          data[scoreObject].gameModeActorName === selectedGameMode &&
          data[scoreObject].songTitle === selectedSong &&
          data[scoreObject].difficulty === selectedDifficulty
        ) {
          scoreMap.set(data[scoreObject].time, {
            score: data[scoreObject].score,
            highScore: data[scoreObject].highScore,
            accuracy: data[scoreObject].accuracy,
            streak: data[scoreObject].streak,
            difficulty: data[scoreObject].difficulty,
            completion: data[scoreObject].completion,
            timeOffset: data[scoreObject].avgTimeOffset,
          });
        }
      }
      const sortedScoreMap = new Map([...scoreMap].sort());
      const keys = [...sortedScoreMap.keys()];
      const values = [...sortedScoreMap.values()];
      setScores(values);
      setDates(keys);
      // bests
      setBestScore(
        Math.round(
          (Math.max(...values.map((value) => value.highScore)) * 10) / 10
        )
      );
      setBestAccuracy(
        Math.round(Math.max(...values.map((value) => value.accuracy)) * 1000) /
          10 +
          "%"
      );
      setBestStreak(Math.max(...values.map((value) => value.streak)));
      setBestCompletion(
        Math.round(
          Math.max(...values.map((value) => value.completion)) * 1000
        ) /
          10 +
          "%"
      );
      setBestTimeOffset(
        Math.round(
          Math.min(...values.map((value) => value.timeOffset)) * 1000
        ) + " ms"
      );
      // averages
      setAvgScore(
        Math.round(
          values
            .map((value) => value.score)
            .reduce((p, c, i, a) => p + c / a.length, 0)
        )
      );
      setAvgAccuracy(
        Math.round(
          values
            .map((value) => value.accuracy)
            .reduce((p, c, i, a) => p + c / a.length, 0) * 1000
        ) /
          10 +
          "%"
      );
      setAvgStreak(
        Math.round(
          values
            .map((value) => value.streak)
            .reduce((p, c, i, a) => p + c / a.length, 0)
        )
      );
      setAvgCompletion(
        Math.round(
          values
            .map((value) => value.completion)
            .reduce((p, c, i, a) => p + c / a.length, 0) * 1000
        ) /
          10 +
          "%"
      );
      setAvgTimeOffset(
        Math.round(
          values
            .map((value) => value.timeOffset)
            .reduce((p, c, i, a) => p + c / a.length, 0) * 1000
        ) + " ms"
      );
    };
    getScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGameMode, selectedSong, selectedDifficulty]);

  /* searches for score objects matching user selected game mode */
  const handleGameModeSelect = async (newValue) => {
    setSelectedGameMode(newValue);
    let matchingSongTitles = [];
    //let matchingDifficulties = [];
    for (let scoreObject in data) {
      if (
        data[scoreObject].gameModeActorName === newValue &&
        !matchingSongTitles.some((e) => e.value === data[scoreObject].songTitle)
      ) {
        matchingSongTitles.push({
          value: data[scoreObject].songTitle,
          label: data[scoreObject].songTitle,
        });
      }
    }
    setSongOptions(matchingSongTitles);
    setSelectedDifficulty("");
    // if (matchingSongTitles.length > 0) {
    //   handleSongSelect(matchingSongTitles[0].value);
    //   //setSelectedSong(matchingSongTitles[0].value);
    // } else {
    //   setSelectedSong("");
    //   setSelectedDifficulty("");
    // }
  };

  /* searches for songs matching the game mode */
  const handleSongSelect = async (newValue) => {
    setSelectedSong(newValue);
    let matchingDifficulties = [];
    for (let scoreObject in data) {
      if (
        data[scoreObject].gameModeActorName === selectedGameMode &&
        data[scoreObject].songTitle === newValue &&
        !matchingDifficulties.some(
          (e) => e.value === data[scoreObject].difficulty
        )
      ) {
        matchingDifficulties.push({
          value: data[scoreObject].difficulty,
          label: data[scoreObject].difficulty,
        });
      }
    }
    setDifficultyOptions(matchingDifficulties);
  };

  const handleDifficultySelect = async (newValue) => {
    setSelectedDifficulty(newValue);
  };

  const scoreOptions = {
    title: "Score vs Time",
    xAxisTitle: "Date",
    yAxisTitle: "Score (thousands)",
    category: "score",
    bDisplayPercentage: true,
  };
  const accuracyOptions = {
    title: "Accuracy vs Time",
    xAxisTitle: "Date",
    yAxisTitle: "Hit Rate (%)",
    category: "accuracy",
    bDisplayPercentage: false,
  };
  const streakOptions = {
    title: "Streak vs Time",
    xAxisTitle: "Date",
    yAxisTitle: "Consecutive Targets Hit",
    category: "streak",
    bDisplayPercentage: false,
  };
  const completionOptions = {
    title: "Average Targets Destroyed",
    xAxisTitle: "Date",
    yAxisTitle: "Completion (%)",
    category: "completion",
    bDisplayPercentage: false,
  };
  const avgTimeOffsetOptions = {
    title: "Average Reaction Time",
    xAxisTitle: "Date",
    yAxisTitle: "Time (ms)",
    category: "avgTimeOffset",
    bDisplayPercentage: false,
  };

  return (
    <>
      <div className="stats-header">
        <h2 className="stats-title">Statistics for {auth.username}</h2>
        <h4 className="stats-subtitle">
          Get started by selecting a game mode or song.
        </h4>
      </div>
      <div className={errMsg ? "responsive-centered-container" : "offscreen"}>
        <p
          ref={errRef}
          className={errMsg ? "errmsg" : "offscreen"}
          aria-live="assertive">
          {errMsg}
        </p>
      </div>
      <div className="responsive-centered-container">
        <div className="select-container">
          <div className="select-wrapper">
            <p className="select-caption fs-200">GameMode:</p>
            <div className="select-wrapper">
              <SelectBox
                id="game-mode-select"
                onChange={(value) => handleGameModeSelect(value.value)}
                placeholder={"Filter by game mode"}
                options={gameModeOptions}
                value={{ label: selectedGameMode, value: selectedGameMode }}
              />
            </div>
          </div>
          <div className="select-wrapper">
            <p className="select-caption fs-200">Song:</p>
            <div className="select-wrapper">
              <SelectBox
                id="song-select"
                onChange={(value) => handleSongSelect(value.value)}
                placeholder={"Filter by song"}
                options={songOptions}
                value={{ label: selectedSong, value: selectedSong }}
              />
            </div>
          </div>
          <div className="select-wrapper">
            <p className="select-caption fs-200">Difficulty:</p>
            <div className="select-wrapper">
              <SelectBox
                id="difficulty-select"
                onChange={(value) => handleDifficultySelect(value.value)}
                placeholder={"Filter by Difficulty"}
                options={difficultyOptions}
                value={{ label: selectedDifficulty, value: selectedDifficulty }}
              />
            </div>
          </div>
        </div>
        <div
          className={
            selectedGameMode !== "" &&
            selectedSong !== "" &&
            selectedDifficulty !== ""
              ? "best-avg-container"
              : "hide"
          }>
          <div className="best-container">
            <ul className="best-list">
              <li className="table-header">
                <h2 className="fs-300 text-light">Best</h2>
              </li>
              <li className="table-row">
                <div className="col col-1">Score:</div>
                <div className="col col-2">{bestScore}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Accuracy:</div>
                <div className="col col-2">{bestAccuracy}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Streak:</div>
                <div className="col col-2">{bestStreak}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Reaction Time:</div>
                <div className="col col-2">{bestTimeOffset}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Targets Destroyed:</div>
                <div className="col col-2">{bestCompletion}</div>
              </li>
            </ul>
          </div>
          <div className="best-container">
            <ul className="best-list">
              <li className="table-header">
                <h2 className="fs-300 text-light">Average</h2>
              </li>
              <li className="table-row">
                <div className="col col-1">Score:</div>
                <div className="col col-2">{avgScore}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Accuracy:</div>
                <div className="col col-2">{avgAccuracy}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Streak:</div>
                <div className="col col-2">{avgStreak}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Reaction Time:</div>
                <div className="col col-2">{avgTimeOffset}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Targets Destroyed:</div>
                <div className="col col-2">{avgCompletion}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div 
        className={
          selectedGameMode !== "" &&
          selectedSong !== "" &&
          selectedDifficulty !== ""
            ? ""
            : "hide"
        }>
        <div>
          {selectedGameMode !== "" && selectedSong !== "" && (
            <LineChart
              labels={dates}
              data={scores.map((value) => value.score)}
              myOptions={scoreOptions}
            />
          )}
        </div>
        <div>
          {selectedGameMode !== "" && selectedSong !== "" && (
            <LineChart
              labels={dates}
              data={scores.map((value) => value.accuracy)}
              myOptions={accuracyOptions}
            />
          )}
        </div>
        <div>
          {selectedGameMode !== "" && selectedSong !== "" && (
            <LineChart
              labels={dates}
              data={scores.map((value) => value.streak)}
              myOptions={streakOptions}
            />
          )}
        </div>
        <div>
          {selectedGameMode !== "" && selectedSong !== "" && (
            <LineChart
              labels={dates}
              data={scores.map((value) => value.completion)}
              myOptions={completionOptions}
            />
          )}
        </div>
        <div>
          {selectedGameMode !== "" && selectedSong !== "" && (
            <LineChart
              labels={dates}
              data={scores.map((value) => value.timeOffset)}
              myOptions={avgTimeOffsetOptions}
            />
          )}
        </div>
      </div>
    </>
  );
};
export default DefaultModes;